import { NextRequest, NextResponse } from "next/server";
import { groqJSON } from "@/lib/llm/groq";
import { getCandidateById, getRoleById, updateCandidateScores } from "@/lib/store";

const SYSTEM = `You are an expert Google recruiter evaluating candidates. Score this candidate on Google's 4 hiring attributes based ONLY on evidence in their resume. Be calibrated — most candidates are not perfect. Return ONLY valid JSON:
{
  "gca": <0.0-1.0>,
  "rrk": <0.0-1.0>,
  "leadership": <0.0-1.0>,
  "googleyness": <0.0-1.0>,
  "evidence": ["specific achievement or quote 1", "specific achievement or quote 2", "specific achievement or quote 3", "specific achievement or quote 4"]
}

Scoring rubric:
- gca (General Cognitive Ability): problem-solving complexity, academic pedigree, systems thinking, learning agility shown in career trajectory
- rrk (Role-Related Knowledge): technical skills and domain expertise directly relevant to the role requirements
- leadership: driving impact, influencing without authority, mentoring, owning projects end-to-end, cross-team collaboration
- googleyness: intellectual curiosity, collaborative mindset, ethical compass, community contribution, comfort with ambiguity

Evidence must be verbatim or closely paraphrased from the resume. Do not invent facts.`;

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

    const userMessage = `Role: ${role.title} — ${role.description}

Resume:
${candidate.resumeText}`;

    const scores = await groqJSON<{
      gca: number;
      rrk: number;
      leadership: number;
      googleyness: number;
      evidence: string[];
    }>(SYSTEM, userMessage);

    // Clamp all scores to [0, 1]
    const clamped = {
      gca: Math.min(1, Math.max(0, scores.gca)),
      rrk: Math.min(1, Math.max(0, scores.rrk)),
      leadership: Math.min(1, Math.max(0, scores.leadership)),
      googleyness: Math.min(1, Math.max(0, scores.googleyness)),
      evidence: Array.isArray(scores.evidence) ? scores.evidence : [],
    };

    updateCandidateScores(candidateId, clamped);

    return NextResponse.json({ ...clamped, candidateId });
  } catch (err) {
    console.error("AI scoring error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
