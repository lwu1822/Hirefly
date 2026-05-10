import { NextRequest, NextResponse } from "next/server";
import { groqJSON } from "@/lib/llm/groq";

const SYSTEM = `You are an expert recruiting consultant. Given a role description, generate a structured hiring rubric based on Google's 4 hiring attributes. Return ONLY valid JSON matching this schema exactly:
{
  "title": "string",
  "team": "string",
  "level": "string",
  "rubric": {
    "gca": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "rrk": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "leadership": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "googleyness": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] }
  }
}
Weights must sum to 100. Each attribute should have 2-4 criteria. Signals must be measurable (e.g. "5+ years owning a production service", not "experienced").`;

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();
    if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

    const result = await groqJSON(SYSTEM, `Role description: ${description}`);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Rubric generation error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
