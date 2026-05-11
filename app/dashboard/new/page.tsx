"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { Company } from "@/lib/data";

type RubricOutput = {
  title: string;
  team: string;
  level: string;
  weightRationale?: string;
  rubric: Record<string, { weight: number; criteria: { name: string; signal: string; required: boolean }[] }>;
  customCategories?: { key: string; label: string; weight: number; criteria: string }[];
};

function NewRoleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get("companyId") ?? "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(preselectedCompanyId);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rubric, setRubric] = useState<RubricOutput | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/companies").then(r => r.json()).then(d => {
      setCompanies(d.companies);
      if (!companyId && d.companies.length > 0) setCompanyId(d.companies[0].id);
    });
  }, []);

  async function publish() {
    if (!rubric) return;
    setPublishing(true);
    try {
      await fetch("/api/roles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rubric.title,
          team: rubric.team,
          level: rubric.level,
          description,
          companyId: companyId || undefined,
          rubric: {
            gca: rubric.rubric.gca?.weight ?? 25,
            rrk: rubric.rubric.rrk?.weight ?? 35,
            leadership: rubric.rubric.leadership?.weight ?? 20,
            googleyness: rubric.rubric.googleyness?.weight ?? 20,
          },
          customCategories: rubric.customCategories ?? [],
        }),
      });
      router.push("/dashboard");
    } catch {
      setError("Failed to publish role.");
    }
    setPublishing(false);
  }

  async function generate() {
    if (description.length < 15) { setError("Please describe the role in more detail."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/rubric/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setRubric(d);
    } catch (e) {
      setError(String(e) + " — Make sure GROQ_API_KEY is set in .env.local");
    }
    setLoading(false);
  }

  const selectedCompany = companies.find(c => c.id === companyId);
  const ATTR_LABELS: Record<string, string> = { gca: "General Cognitive Ability", rrk: "Role-Related Knowledge", leadership: "Leadership", googleyness: "Googleyness" };
  const ATTR_COLORS: Record<string, string> = { gca: "#2563eb", rrk: "#16a34a", leadership: "#d97706", googleyness: "#7c3aed" };

  return (
    <div className="app-layout">
      <Sidebar active="new" />
      <div className="main">
        <div className="topbar">
          <button className="btn btn-sm" onClick={() => router.push("/dashboard")} style={{ padding: "4px 10px" }}>← Back</button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Create New Role</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Describe the role</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Write in plain language — Hirefly will generate a structured rubric using Google's 4 hiring attributes.</div>

            {/* Company selector */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Company</div>
              {companies.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text3)" }}>
                  No companies yet —{" "}
                  <span style={{ color: "var(--blue-text)", cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/dashboard")}>
                    create one on the dashboard first
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {companies.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setCompanyId(c.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 10, cursor: "pointer",
                        border: companyId === c.id ? "2px solid transparent" : "2px solid var(--border)",
                        background: companyId === c.id ? "var(--bg2)" : "transparent",
                        outline: companyId === c.id ? `2px solid ${c.color.match(/#[a-f0-9]+/i)?.[0] ?? "#0d9488"}` : "none",
                        outlineOffset: 2, transition: "all 0.1s",
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: companyId === c.id ? 700 : 500 }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedCompany && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text3)" }}>
                  This role will be added to <strong style={{ color: "var(--text1)" }}>{selectedCompany.name}</strong>
                </div>
              )}
            </div>

            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Role description</div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. I need an L5 backend engineer for our payments infra team. Should know distributed systems, ideally has owned a service end-to-end. Experience with Go or Java preferred. Not a manager role but should be able to influence without authority."
                style={{ width: "100%", height: 100, padding: 10, resize: "none", fontSize: 13, lineHeight: 1.5 }}
              />
              {error && <div style={{ marginTop: 8, fontSize: 13, color: "var(--red-text)" }}>{error}</div>}
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generate} disabled={loading}>
                {loading ? "⟳ Generating rubric…" : "✨ Generate Rubric with AI →"}
              </button>
            </div>

            {loading && (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 32, textAlign: "center", color: "var(--text2)", fontSize: 14 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>⟳</div>
                Generating structured rubric with Groq Llama 3.3 70B…
              </div>
            )}

            {rubric && !loading && (
              <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{rubric.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{rubric.team} · {rubric.level}{selectedCompany ? ` · ${selectedCompany.name}` : ""}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={publish} disabled={publishing}>
                    {publishing ? "Publishing…" : "Publish Role ✓"}
                  </button>
                </div>

                {/* Weight rationale banner */}
                {rubric.weightRationale && (
                  <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--blue-bg)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text1)", lineHeight: 1.6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--blue-text)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>Why these weights?</span>
                    {rubric.weightRationale}
                  </div>
                )}

                {/* Base 4 rubric categories */}
                {Object.entries(rubric.rubric).map(([key, attr]) => (
                  <div key={key} style={{ marginBottom: 12, padding: 14, background: "var(--bg2)", borderRadius: 8, borderLeft: `3px solid ${ATTR_COLORS[key] ?? "#888"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ATTR_LABELS[key] ?? key}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${attr.weight}%`, height: "100%", background: ATTR_COLORS[key] ?? "#888", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ATTR_COLORS[key] ?? "#888", minWidth: 30 }}>{attr.weight}%</span>
                      </div>
                    </div>
                    {attr.criteria.map((c, i) => (
                      <div key={i} style={{ marginBottom: 5, fontSize: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 2, flexShrink: 0, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: c.required ? "#dbeafe" : "var(--bg)", color: c.required ? "#1d4ed8" : "var(--text3)", border: "1px solid", borderColor: c.required ? "#93c5fd" : "var(--border)" }}>
                          {c.required ? "required" : "nice-to-have"}
                        </span>
                        <div>
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                          <span style={{ color: "var(--text2)", marginLeft: 4 }}>— {c.signal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* AI-suggested custom categories */}
                {rubric.customCategories && rubric.customCategories.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      ✦ Role-Specific Categories (AI suggested)
                    </div>
                    {rubric.customCategories.map(cat => (
                      <div key={cat.key} style={{ marginBottom: 12, padding: 14, background: "#fdf4ff", borderRadius: 8, borderLeft: "3px solid #7c3aed", border: "1px solid #e9d5ff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#6d28d9" }}>{cat.label}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 80, height: 5, background: "#e9d5ff", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${cat.weight}%`, height: "100%", background: "#7c3aed", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", minWidth: 30 }}>{cat.weight}%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#4c1d95", lineHeight: 1.5 }}>{cat.criteria}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: -4, marginBottom: 8 }}>
                      These will be added as extra scoring dimensions. You can edit them after publishing.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewRolePage() {
  return (
    <Suspense>
      <NewRoleForm />
    </Suspense>
  );
}
