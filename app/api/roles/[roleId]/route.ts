import { NextRequest, NextResponse } from "next/server";
import { getRoleById } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const role = getRoleById(roleId);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ role });
}
