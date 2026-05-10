import { NextRequest, NextResponse } from "next/server";
import { getCandidatesForRole } from "@/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const candidates = getCandidatesForRole(roleId);
  return NextResponse.json({ candidates });
}
