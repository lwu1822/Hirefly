import { NextRequest, NextResponse } from "next/server";
import { getCandidateById, getRoles, computeScore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");
    const currentRoleId = req.nextUrl.searchParams.get("roleId");
    if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });

    const candidate = getCandidateById(candidateId);
    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const roles = getRoles().filter(r => r.id !== currentRoleId && r.status !== "closed");

    const matches = roles
      .map(role => ({
        roleId: role.id,
        title: role.title,
        team: role.team,
        level: role.level,
        score: computeScore(candidate, role.rubric),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
