import { NextRequest, NextResponse } from "next/server";
import { getCompanies, addCompany } from "@/lib/store";
import { COMPANY_COLORS } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ companies: getCompanies() });
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const company = {
      id: `co-${Date.now()}`,
      name: name.trim(),
      color: color || COMPANY_COLORS[0],
    };
    addCompany(company);
    return NextResponse.json({ company });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
