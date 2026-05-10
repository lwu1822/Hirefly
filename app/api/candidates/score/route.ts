import { NextRequest, NextResponse } from "next/server";
import { updateCandidateStatus } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
    updateCandidateStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
