import { NextRequest, NextResponse } from "next/server";
import { cloneCandidateToRole, getRoleById, computeScore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, roleId } = await req.json();
    if (!candidateId || !roleId) {
      return NextResponse.json({ error: "candidateId and roleId required" }, { status: 400 });
    }
    const role = getRoleById(roleId);
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });

    const clone = cloneCandidateToRole(candidateId, roleId);
    if (!clone) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

    return NextResponse.json({ candidate: { ...clone, overall: computeScore(clone, role.rubric) } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
