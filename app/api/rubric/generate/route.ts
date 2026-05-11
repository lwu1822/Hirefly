import { NextRequest, NextResponse } from "next/server";
import { groqJSON } from "@/lib/llm/groq";

const SYSTEM = `You are an expert recruiting consultant. Given a role description, generate a structured hiring rubric. Return ONLY valid JSON matching this schema exactly:
{
  "title": "string — inferred job title",
  "team": "string — inferred team/domain",
  "level": "string — one of L3, L4, L5, L6, L7",
  "weightRationale": "string — 1-2 sentences explaining WHY you chose these specific weights for this role (e.g. 'RRK weighted highest at 40% because this is a senior IC payments role requiring deep production systems expertise; leadership lower at 15% since no direct reports expected')",
  "rubric": {
    "gca": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "rrk": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "leadership": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] },
    "googleyness": { "weight": number, "criteria": [{"name":"string","signal":"string","required":boolean}] }
  },
  "customCategories": [
    { "key": "snake_case_key", "label": "Display Label", "weight": number, "criteria": "string — measurable signals for this category" }
  ]
}

Rules:
- The 4 base weights (gca + rrk + leadership + googleyness) must sum to 100.
- customCategories is an array of 0-2 role-specific extra dimensions NOT covered by the 4 base categories (e.g. "Domain Expertise" for a niche role, "Research Output" for a research role, "Customer Empathy" for a product-facing role). Leave it empty [] if the base 4 cover the role adequately.
- Criteria signals must be concrete and measurable (e.g. "Shipped a payment processing system handling $1B+ GMV", NOT "experienced with payments").
- Each attribute should have 2-4 criteria.
- Weights should reflect the actual importance for THIS role — do not default to 25/25/25/25.`;

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
