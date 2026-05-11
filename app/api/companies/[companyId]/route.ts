import { NextRequest, NextResponse } from "next/server";
import { deleteCompany } from "@/lib/store";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const { companyId } = await params;
    deleteCompany(companyId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
