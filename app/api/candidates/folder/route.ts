import { NextRequest, NextResponse } from "next/server";
import { updateCandidateFolder } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, folder } = await req.json();
    if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });
    updateCandidateFolder(candidateId, folder || undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
