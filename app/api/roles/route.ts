import { NextRequest, NextResponse } from "next/server";
import { getRoles, addRole, updateCustomCategories } from "@/lib/store";
import type { Role } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ roles: getRoles() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role: Role = {
      id: `r-${Date.now()}`,
      title: body.title,
      team: body.team,
      level: body.level,
      daysOpen: 0,
      description: body.description ?? "",
      rubric: {
        gca: body.rubric?.gca ?? 25,
        rrk: body.rubric?.rrk ?? 35,
        leadership: body.rubric?.leadership ?? 20,
        googleyness: body.rubric?.googleyness ?? 20,
      },
      companyId: body.companyId ?? undefined,
    };
    addRole(role);
    if (Array.isArray(body.customCategories) && body.customCategories.length > 0) {
      updateCustomCategories(role.id, body.customCategories);
    }
    return NextResponse.json({ role });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
