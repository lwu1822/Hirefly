import { NextRequest, NextResponse } from "next/server";
import { getRoleById, closeRole, reopenRole, updateRoleCriteria, updateRoleLabels, updateCustomCategories } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const role = getRoleById(roleId);
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ role });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const body = await req.json();
  if (body.criteria) updateRoleCriteria(roleId, body.criteria);
  if (body.labels) updateRoleLabels(roleId, body.labels);
  if (body.customCategories !== undefined) updateCustomCategories(roleId, body.customCategories);
  if (body.status === "open") reopenRole(roleId);
  if (body.status === "closed") closeRole(roleId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  closeRole(roleId);
  return NextResponse.json({ ok: true });
}
