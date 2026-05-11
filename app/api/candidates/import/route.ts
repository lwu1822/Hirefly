import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;
import { groqJSON } from "@/lib/llm/groq";
import { addCandidate, getRoles, computeScore, cloneCandidateToRole } from "@/lib/store";
import { DEFAULT_CRITERIA } from "@/lib/data";

const SYSTEM_PROMPT = `You are analyzing a resume. Extract structured candidate info AND score on Google's 4 hiring attributes based only on evidence in the resume.

Return ONLY valid JSON — no markdown, no explanation:
{
  "name": "Full Name",
  "email": "email or empty string",
  "title": "current or most recent job title",
  "company": "current or most recent company",
  "school": "highest degree institution or empty string",
  "yoe": <integer years of total experience>,
  "skills": ["skill1", "skill2"] (up to 8 most relevant technical skills),
  "gca": <0.0-1.0 — problem-solving, learning agility, academic trajectory>,
  "rrk": <0.0-1.0 — hands-on technical depth, production ownership>,
  "leadership": <0.0-1.0 — mentoring, cross-team influence, driving outcomes>,
  "googleyness": <0.0-1.0 — curiosity, collaboration, comfort with ambiguity>,
  "evidence": ["specific achievement 1", "specific achievement 2", "specific achievement 3", "specific achievement 4"]
}`;

type ParsedCandidate = {
  name: string; email: string; title: string; company: string; school: string;
  yoe: number; skills: string[]; gca: number; rrk: number; leadership: number;
  googleyness: number; evidence: string[];
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const companyId = form.get("companyId") as string | null;

    if (!file || !companyId) {
      return NextResponse.json({ error: "file and companyId are required" }, { status: 400 });
    }

    const allRoles = getRoles();
    const companyRoles = allRoles.filter(r => r.companyId === companyId && r.status !== "closed");
    if (companyRoles.length === 0) {
      return NextResponse.json({ error: "No open roles found for this company. Add roles first." }, { status: 400 });
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
          if (!text?.trim()) return { filename, error: "Could not extract text from PDF" };

          const parsed = await groqJSON<ParsedCandidate>(
            SYSTEM_PROMPT,
            `Resume:\n${text.slice(0, 6000)}`
          );

          const clamp = (n: number) => Math.min(1, Math.max(0, Number(n) || 0));
          const base = {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: parsed.name || filename.replace(".pdf", ""),
            email: parsed.email || "",
            title: parsed.title || "Unknown",
            company: parsed.company || "Unknown",
            school: parsed.school || "",
            yoe: Number(parsed.yoe) || 0,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            gca: clamp(parsed.gca),
            rrk: clamp(parsed.rrk),
            leadership: clamp(parsed.leadership),
            googleyness: clamp(parsed.googleyness),
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
            resumeText: text.slice(0, 8000),
            status: "pending" as const,
          };

          // Score against every company role, place in the best match
          const scored = companyRoles
            .map(r => ({ role: r, score: computeScore(base as Parameters<typeof computeScore>[0], r.rubric) }))
            .sort((a, b) => b.score - a.score);

          const bestMatch = scored[0];
          const candidate = { ...base, roleId: bestMatch.role.id };
          addCandidate(candidate);

          // Auto-clone into other company roles with score >= 0.70
          scored.slice(1).filter(x => x.score >= 0.70).forEach(x => cloneCandidateToRole(candidate.id, x.role.id));

          // Auto-clone into similar roles outside this company with score >= 0.70 (max 2)
          const externalMatches = allRoles
            .filter(r => r.companyId !== companyId && r.status !== "closed")
            .map(r => ({ id: r.id, title: r.title, score: computeScore(candidate, r.rubric) }))
            .filter(r => r.score >= 0.70)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);
          externalMatches.forEach(r => cloneCandidateToRole(candidate.id, r.id));

          return {
            filename,
            name: candidate.name,
            title: candidate.title,
            company: candidate.company,
            placedRole: bestMatch.role.title,
            placedRoleId: bestMatch.role.id,
            overall: bestMatch.score,
            otherCompanyRoles: scored.slice(1).filter(x => x.score >= 0.70).map(x => x.role.title),
            externalRoles: externalMatches.map(r => r.title),
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
