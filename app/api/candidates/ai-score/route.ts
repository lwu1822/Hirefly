import { NextRequest, NextResponse } from "next/server";
import { groqJSON } from "@/lib/llm/groq";
import { getCandidateById, getRoleById, updateCandidateScores } from "@/lib/store";
import { DEFAULT_CRITERIA, type CustomCategory } from "@/lib/data";

function buildSystem(criteria: typeof DEFAULT_CRITERIA, customCats: CustomCategory[]) {
  const customFields = customCats.length
    ? `,\n  "customScores": {\n${customCats.map(c => `    "${c.key}": <0.0-1.0>`).join(",\n")}\n  }`
    : "";

  const customCriteria = customCats.length
    ? `\n\nCustom scoring criteria for this role:\n${customCats.map(c => `- ${c.key} (${c.label}): ${c.criteria}`).join("\n")}`
    : "";

  return `You are an expert recruiter evaluating candidates. Score this candidate based ONLY on evidence in their resume. Be calibrated — most candidates are not perfect. Return ONLY valid JSON:
{
  "gca": <0.0-1.0>,
  "rrk": <0.0-1.0>,
  "leadership": <0.0-1.0>,
  "googleyness": <0.0-1.0>${customFields},
  "evidence": ["specific achievement 1", "specific achievement 2", "specific achievement 3", "specific achievement 4"]
}

Scoring criteria:
- gca (General Cognitive Ability): ${criteria.gca}
- rrk (Role-Related Knowledge): ${criteria.rrk}
- leadership: ${criteria.leadership}
- googleyness: ${criteria.googleyness}${customCriteria}

Evidence must be verbatim or closely paraphrased from the resume. Do not invent facts.`;
}

export async function POST(req: NextRequest) {
  try {
    const { candidateId, roleId } = await req.json();
    if (!candidateId || !roleId) {
      return NextResponse.json({ error: "candidateId and roleId required" }, { status: 400 });
    }

    const candidate = getCandidateById(candidateId);
    const role = getRoleById(roleId);
    if (!candidate || !role) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const criteria = { ...DEFAULT_CRITERIA, ...role.criteria };
    const customCats = role.customCategories ?? [];

    const raw = await groqJSON<{
      gca: number; rrk: number; leadership: number; googleyness: number;
      evidence: string[];
      customScores?: Record<string, number>;
    }>(buildSystem(criteria, customCats), `Role: ${role.title} — ${role.description}\n\nResume:\n${candidate.resumeText}`);

    const clamp = (n: number) => Math.min(1, Math.max(0, Number(n) || 0));
    const customScores: Record<string, number> = {};
    if (customCats.length && raw.customScores) {
      for (const cat of customCats) {
        customScores[cat.key] = clamp(raw.customScores[cat.key] ?? 0);
      }
    }

    const clamped = {
      gca: clamp(raw.gca),
      rrk: clamp(raw.rrk),
      leadership: clamp(raw.leadership),
      googleyness: clamp(raw.googleyness),
      evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
      customScores: customCats.length ? customScores : undefined,
    };

    updateCandidateScores(candidateId, clamped);
    return NextResponse.json({ ...clamped, candidateId });
  } catch (err) {
    console.error("AI scoring error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
