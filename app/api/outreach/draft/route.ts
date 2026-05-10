import { NextRequest, NextResponse } from "next/server";
import { groqText } from "@/lib/llm/groq";
import { getCandidateById, getRoleById } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, roleId, tone = "warm" } = await req.json();
    const candidate = getCandidateById(candidateId);
    const role = getRoleById(roleId);
    if (!candidate || !role) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const system = `You are a senior technical recruiter writing personalized outreach. Write a ${tone} LinkedIn/email message that:
- References 2-3 specific facts from the candidate's background
- Mentions the role and why they are a strong fit
- Is 3-4 sentences max
- Never uses generic praise like "impressive background"
- Signs off as Jamie Liu, Technical Recruiter at Google`;

    const user = `Candidate: ${candidate.name}, ${candidate.title} at ${candidate.company}
Key achievements: ${candidate.evidence.slice(0, 2).join("; ")}
Role: ${role.title} on ${role.team} team
Write the personalized outreach message.`;

    const message = await groqText(system, user);
    const generic = `Hi ${candidate.name}, I came across your profile and was impressed by your background. We have an exciting ${role.title} opportunity at Google that I think you'd be a great fit for. Would love to connect!`;

    return NextResponse.json({ personalized: message, generic });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
