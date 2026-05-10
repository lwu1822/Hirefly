import { NextRequest, NextResponse } from "next/server";
import { getRoleById, removeRole } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const role = getRoleById(roleId);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ role });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  removeRole(roleId);
  return NextResponse.json({ ok: true });
}
