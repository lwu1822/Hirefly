"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { Company, Role } from "@/lib/data";

type ImportResult = {
  filename: string;
  name?: string;
  title?: string;
  company?: string;
  placedRole?: string;
  placedRoleId?: string;
  overall?: number;
  otherCompanyRoles?: string[];
  externalRoles?: string[];
  error?: string;
};

function pct(v: number) { return Math.round(v * 100); }

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then(r => r.json()),
      fetch("/api/roles").then(r => r.json()),
    ]).then(([cd, rd]) => {
      setCompanies(cd.companies);
      setRoles(rd.roles);
      if (cd.companies.length > 0) setCompanyId(cd.companies[0].id);
    });
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".zip")) { setFile(dropped); setError(""); }
    else setError("Please drop a .zip file.");
  }

  async function handleImport() {
    if (!file || !companyId) return;
    setImporting(true);
    setResults(null);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("companyId", companyId);
      const res = await fetch("/api/candidates/import", { method: "POST", body: form });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setResults(d.results);
    } catch (e) {
      setError(String(e));
    }
    setImporting(false);
  }

  const selectedCompany = companies.find(c => c.id === companyId);
  const companyRoles = roles.filter(r => r.companyId === companyId && r.status !== "closed");
  const succeeded = results?.filter(r => !r.error) ?? [];
  const failed = results?.filter(r => r.error) ?? [];

  return (
    <div className="app-layout">
      <Sidebar active="import" />
      <div className="main">
        <div className="topbar">
          <button className="btn btn-sm" onClick={() => router.push("/dashboard")} style={{ padding: "4px 10px" }}>← Back</button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Import Resumes</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Import from ZIP</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>
              Upload a ZIP of PDF resumes. Candidates are AI-scored and automatically placed into the best-matching role within the selected company.
            </div>

            {/* Company selector */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Target company</div>
              {companies.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text3)" }}>
                  No companies yet —{" "}
                  <span style={{ color: "var(--blue-text)", cursor: "pointer", textDecoration: "underline" }} onClick={() => router.push("/dashboard")}>
                    create one first
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                  {companies.map(c => (
                    <div
                      key={c.id}
                      onClick={() => { setCompanyId(c.id); setResults(null); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
                        borderRadius: 10, cursor: "pointer", transition: "all 0.1s",
                        border: companyId === c.id ? "2px solid transparent" : "2px solid var(--border)",
                        background: companyId === c.id ? "var(--bg2)" : "transparent",
                        boxShadow: companyId === c.id ? `0 0 0 2px ${c.color.match(/#[a-f0-9]{6}/i)?.[0] ?? "#0d9488"}` : "none",
                      }}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: companyId === c.id ? 700 : 500 }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Show roles in selected company */}
              {selectedCompany && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Open roles in {selectedCompany.name}
                  </div>
                  {companyRoles.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--red-text)", background: "var(--red-bg)", padding: "8px 12px", borderRadius: 8 }}>
                      No open roles — candidates cannot be imported without at least one role.{" "}
                      <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => router.push(`/dashboard/new?companyId=${companyId}`)}>
                        Add a role →
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {companyRoles.map(r => (
                        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", background: "var(--bg2)", borderRadius: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "var(--blue-bg)", color: "var(--blue-text)" }}>{r.level}</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</span>
                          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>{r.team}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                        Each candidate will be placed in their best-matching role above. Scores ≥ 70% also get added to other matching roles.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                background: dragging ? "var(--blue-bg)" : "var(--bg3)",
                border: `2px dashed ${dragging ? "var(--blue-text)" : file ? "#16a34a" : "var(--border)"}`,
                borderRadius: 12, padding: "36px 24px", textAlign: "center",
                cursor: "pointer", transition: "all 0.15s", marginBottom: 16,
              }}
            >
              <input ref={fileInputRef} type="file" accept=".zip" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(""); } }} />
              <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? "📦" : "↑"}</div>
              {file ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#16a34a" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{(file.size / 1024).toFixed(0)} KB · click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Drop a ZIP file here</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>or click to browse · .zip containing PDF resumes</div>
                </>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red-text)", background: "var(--red-bg)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>{error}</div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 14 }}
              onClick={handleImport}
              disabled={!file || !companyId || companyRoles.length === 0 || importing}
            >
              {importing ? "⟳ Parsing & matching candidates to roles…" : "✦ Import & Match Resumes"}
            </button>

            {importing && (
              <div style={{ marginTop: 16, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>⟳</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>Extracting PDFs → scoring with Groq → matching to best role…</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>All resumes processed in parallel</div>
              </div>
            )}

            {/* Results */}
            {results && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {succeeded.length} imported · {failed.length} failed
                  </div>
                  {succeeded.length > 0 && (
                    <button className="btn btn-primary btn-sm" onClick={() => router.push("/dashboard")}>
                      View dashboard →
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: r.error ? "var(--red-bg)" : "var(--bg3)",
                        border: `1px solid ${r.error ? "#fca5a5" : "var(--border)"}`,
                        borderRadius: 10, padding: "12px 16px",
                        display: "flex", alignItems: "flex-start", gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 18, marginTop: 1 }}>{r.error ? "✕" : "✓"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {r.error ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--red-text)" }}>{r.filename}</div>
                            <div style={{ fontSize: 12, color: "var(--red-text)", opacity: 0.8 }}>{r.error}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>{r.title} · {r.company}</div>
                            {r.placedRole && (
                              <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ color: "var(--text3)" }}>Placed in</span>
                                <span
                                  onClick={() => r.placedRoleId && router.push(`/dashboard/${r.placedRoleId}`)}
                                  style={{ fontWeight: 600, color: "var(--blue-text)", cursor: "pointer", textDecoration: "underline" }}
                                >
                                  {r.placedRole}
                                </span>
                              </div>
                            )}
                            {r.otherCompanyRoles && r.otherCompanyRoles.length > 0 && (
                              <div style={{ fontSize: 11, color: "#15803d", marginTop: 2 }}>
                                ✦ Also added to: {r.otherCompanyRoles.join(", ")}
                              </div>
                            )}
                            {r.externalRoles && r.externalRoles.length > 0 && (
                              <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>
                                ✦ Cross-company match: {r.externalRoles.join(", ")}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {!r.error && r.overall !== undefined && (
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--blue-text)", flexShrink: 0 }}>{pct(r.overall)}%</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
