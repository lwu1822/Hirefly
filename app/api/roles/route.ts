import { NextResponse } from "next/server";
import { getRoles } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ roles: getRoles() });
}
