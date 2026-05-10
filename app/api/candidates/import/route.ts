import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;
import { groqJSON } from "@/lib/llm/groq";
import { addCandidate, getRoleById } from "@/lib/store";

const SYSTEM = `You are analyzing a resume for a job application. Extract structured candidate info AND score on Google's 4 hiring attributes based only on evidence in the resume.

Return ONLY valid JSON — no markdown, no explanation:
{
  "name": "Full Name",
  "email": "email or empty string",
  "title": "current or most recent job title",
  "company": "current or most recent company",
  "school": "highest degree institution or empty string",
  "yoe": <integer years of total experience>,
  "skills": ["skill1", "skill2"] (up to 8 most relevant technical skills),
  "gca": <0.0-1.0>,
  "rrk": <0.0-1.0>,
  "leadership": <0.0-1.0>,
  "googleyness": <0.0-1.0>,
  "evidence": ["specific achievement 1", "specific achievement 2", "specific achievement 3", "specific achievement 4"]
}

Scoring rubric:
- gca: problem-solving complexity, academic pedigree, systems thinking, learning agility
- rrk: technical skills and domain expertise relevant to the role
- leadership: driving impact, mentoring, owning projects end-to-end, cross-team work
- googleyness: intellectual curiosity, collaboration, community contribution, comfort with ambiguity`;

type ParsedCandidate = {
  name: string;
  email: string;
  title: string;
  company: string;
  school: string;
  yoe: number;
  skills: string[];
  gca: number;
  rrk: number;
  leadership: number;
  googleyness: number;
  evidence: string[];
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const roleId = form.get("roleId") as string | null;

    if (!file || !roleId) {
      return NextResponse.json({ error: "file and roleId are required" }, { status: 400 });
    }

    const role = getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const zipBuffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(zipBuffer);
    const pdfEntries = zip.getEntries().filter(e =>
      !e.isDirectory && e.entryName.toLowerCase().endsWith(".pdf")
    );

    if (pdfEntries.length === 0) {
      return NextResponse.json({ error: "No PDF files found in ZIP" }, { status: 400 });
    }

    const results = await Promise.all(
      pdfEntries.map(async (entry) => {
        const filename = entry.name;
        try {
          const pdfBuffer = entry.getData();
          const { text } = await pdfParse(pdfBuffer);

          if (!text?.trim()) {
            return { filename, error: "Could not extract text from PDF" };
          }

          const parsed = await groqJSON<ParsedCandidate>(
            SYSTEM,
            `Role: ${role.title} — ${role.description}\n\nResume:\n${text.slice(0, 6000)}`
          );

          const candidate = {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: parsed.name || filename.replace(".pdf", ""),
            email: parsed.email || "",
            title: parsed.title || "Unknown",
            company: parsed.company || "Unknown",
            school: parsed.school || "",
            yoe: Number(parsed.yoe) || 0,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            gca: Math.min(1, Math.max(0, Number(parsed.gca) || 0)),
            rrk: Math.min(1, Math.max(0, Number(parsed.rrk) || 0)),
            leadership: Math.min(1, Math.max(0, Number(parsed.leadership) || 0)),
            googleyness: Math.min(1, Math.max(0, Number(parsed.googleyness) || 0)),
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
            resumeText: text.slice(0, 8000),
            status: "pending" as const,
            roleId,
          };

          addCandidate(candidate);

          return {
            filename,
            name: candidate.name,
            title: candidate.title,
            company: candidate.company,
            overall:
              (candidate.gca * role.rubric.gca +
                candidate.rrk * role.rubric.rrk +
                candidate.leadership * role.rubric.leadership +
                candidate.googleyness * role.rubric.googleyness) /
              (role.rubric.gca + role.rubric.rrk + role.rubric.leadership + role.rubric.googleyness),
          };
        } catch (err) {
          return { filename, error: String(err) };
        }
      })
    );

    const imported = results.filter(r => !("error" in r && r.error)).length;
    return NextResponse.json({ results, imported, total: pdfEntries.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
