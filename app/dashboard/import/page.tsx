"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { Role } from "@/lib/data";

type ImportResult = {
  filename: string;
  name?: string;
  title?: string;
  company?: string;
  overall?: number;
  error?: string;
};

function pct(v: number) { return Math.round(v * 100); }

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/roles").then(r => r.json()).then(d => {
      setRoles(d.roles);
      if (d.roles.length > 0) setRoleId(d.roles[0].id);
    });
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".zip")) setFile(dropped);
    else setError("Please drop a .zip file.");
  }

  async function handleImport() {
    if (!file || !roleId) return;
    setImporting(true);
    setResults(null);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("roleId", roleId);

      const res = await fetch("/api/candidates/import", { method: "POST", body: form });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setResults(d.results);
    } catch (e) {
      setError(String(e));
    }
    setImporting(false);
  }

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
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Import from ZIP</div>
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 24 }}>
              Upload a ZIP of PDF resumes. Each resume is parsed and AI-scored against the selected role's rubric.
            </div>

            {/* Role selector */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Target role</div>
              <select
                value={roleId}
                onChange={e => setRoleId(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.title} — {r.team}</option>
                ))}
              </select>
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
                borderRadius: 12, padding: "40px 24px", textAlign: "center",
                cursor: "pointer", transition: "all 0.15s", marginBottom: 16,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                style={{ display: "none" }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setError(""); }
                }}
              />
              <div style={{ fontSize: 32, marginBottom: 10 }}>{file ? "📦" : "↑"}</div>
              {file ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#16a34a" }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                    {(file.size / 1024).toFixed(0)} KB · click to change
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Drop a ZIP file here</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>or click to browse · .zip containing PDF resumes</div>
                </>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red-text)", background: "var(--red-bg)", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 14 }}
              onClick={handleImport}
              disabled={!file || !roleId || importing}
            >
              {importing
                ? "⟳ Parsing resumes & scoring with AI…"
                : "✦ Import & Score Resumes"}
            </button>

            {importing && (
              <div style={{ marginTop: 16, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>⟳</div>
                <div style={{ fontSize: 13, color: "var(--text2)" }}>
                  Extracting PDFs → parsing text → scoring with Groq Llama 3.3 70B…
                </div>
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
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => router.push(`/dashboard/${roleId}`)}
                    >
                      View in pipeline →
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
                        display: "flex", alignItems: "center", gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{r.error ? "✕" : "✓"}</div>
                      <div style={{ flex: 1 }}>
                        {r.error ? (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--red-text)" }}>{r.filename}</div>
                            <div style={{ fontSize: 12, color: "var(--red-text)", opacity: 0.8 }}>{r.error}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                            <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.title} · {r.company}</div>
                          </>
                        )}
                      </div>
                      {!r.error && r.overall !== undefined && (
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#2563eb" }}>{pct(r.overall)}%</div>
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
