import { NextRequest, NextResponse } from "next/server";
import { groqJSON } from "@/lib/llm/groq";
import { getCandidateById, getRoleById, updateCandidateScores } from "@/lib/store";
import { DEFAULT_CRITERIA, type CustomCategory } from "@/lib/data";

function buildSystem(criteria: typeof DEFAULT_CRITERIA, customCats: CustomCategory[]) {
  const customScoreFields = customCats.length
    ? `,\n  "customScores": {\n${customCats.map(c => `    "${c.key}": <0.0-1.0>`).join(",\n")}\n  },\n  "customRationale": {\n${customCats.map(c => `    "${c.key}": "one sentence WHY this score"`).join(",\n")}\n  }`
    : "";

  const customCriteria = customCats.length
    ? `\n\nCustom scoring criteria:\n${customCats.map(c => `- ${c.key} (${c.label}): ${c.criteria}`).join("\n")}`
    : "";

  return `You are an expert recruiter evaluating candidates for a specific role. Score this candidate based ONLY on evidence in their resume. Be calibrated — most candidates are not perfect. Return ONLY valid JSON:
{
  "gca": <0.0-1.0>,
  "rrk": <0.0-1.0>,
  "leadership": <0.0-1.0>,
  "googleyness": <0.0-1.0>,
  "rationale": {
    "gca": "one sentence: cite the specific resume evidence that drove this score",
    "rrk": "one sentence: cite the specific resume evidence that drove this score",
    "leadership": "one sentence: cite the specific resume evidence that drove this score",
    "googleyness": "one sentence: cite the specific resume evidence that drove this score"
  }${customScoreFields},
  "evidence": ["specific achievement 1", "specific achievement 2", "specific achievement 3", "specific achievement 4"]
}

Scoring criteria:
- gca (General Cognitive Ability): ${criteria.gca}
- rrk (Role-Related Knowledge): ${criteria.rrk}
- leadership: ${criteria.leadership}
- googleyness: ${criteria.googleyness}${customCriteria}

Rationale rules: each rationale sentence must name a concrete fact from the resume (e.g. "Owned 15B-span/day ingestion pipeline at Datadog, indicating deep production systems expertise"). Do not write generic statements. Evidence bullets must be verbatim or closely paraphrased from the resume.`;
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
      rationale?: Record<string, string>;
      evidence: string[];
      customScores?: Record<string, number>;
      customRationale?: Record<string, string>;
    }>(buildSystem(criteria, customCats), `Role: ${role.title} — ${role.description}\n\nResume:\n${candidate.resumeText}`);

    const clamp = (n: number) => Math.min(1, Math.max(0, Number(n) || 0));

    const customScores: Record<string, number> = {};
    if (customCats.length && raw.customScores) {
      for (const cat of customCats) {
        customScores[cat.key] = clamp(raw.customScores[cat.key] ?? 0);
      }
    }

    // Merge base rationale + custom rationale into one map
    const rationale: Record<string, string> = { ...(raw.rationale ?? {}) };
    if (customCats.length && raw.customRationale) {
      for (const cat of customCats) {
        if (raw.customRationale[cat.key]) rationale[cat.key] = raw.customRationale[cat.key];
      }
    }

    const clamped = {
      gca: clamp(raw.gca),
      rrk: clamp(raw.rrk),
      leadership: clamp(raw.leadership),
      googleyness: clamp(raw.googleyness),
      evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
      rationale: Object.keys(rationale).length > 0 ? rationale : undefined,
      customScores: customCats.length ? customScores : undefined,
    };

    updateCandidateScores(candidateId, clamped);
    return NextResponse.json({ ...clamped, candidateId });
  } catch (err) {
    console.error("AI scoring error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
