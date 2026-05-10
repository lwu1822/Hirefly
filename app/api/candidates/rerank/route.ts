import { NextRequest, NextResponse } from "next/server";
import { getCandidatesForRole, updateRubric } from "@/lib/store";
import type { RubricWeights } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const { roleId, rubric }: { roleId: string; rubric: RubricWeights } = await req.json();
    if (!roleId || !rubric) return NextResponse.json({ error: "roleId and rubric required" }, { status: 400 });

    updateRubric(roleId, rubric);
    const ranked = getCandidatesForRole(roleId, rubric);
    return NextResponse.json({ candidates: ranked });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
