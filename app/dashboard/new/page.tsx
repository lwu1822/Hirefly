"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type RubricOutput = {
  title: string;
  team: string;
  level: string;
  rubric: Record<string, { weight: number; criteria: { name: string; signal: string; required: boolean }[] }>;
};

export default function NewRolePage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [rubric, setRubric] = useState<RubricOutput | null>(null);
  const [error, setError] = useState("");

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
            <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Write in plain language — HireIQ will generate a structured rubric using Google's 4 hiring attributes.</div>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{rubric.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)" }}>{rubric.team} · {rubric.level}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => { alert("Role published! Candidates can now apply at /apply/r-new"); router.push("/dashboard"); }}>
                    Publish Role ✓
                  </button>
                </div>
                {Object.entries(rubric.rubric).map(([key, attr]) => (
                  <div key={key} style={{ marginBottom: 16, padding: 14, background: "var(--bg2)", borderRadius: 8, borderLeft: `3px solid ${ATTR_COLORS[key] ?? "#888"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ATTR_LABELS[key] ?? key}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: ATTR_COLORS[key] ?? "#888" }}>{attr.weight}%</span>
                    </div>
                    {attr.criteria.map((c, i) => (
                      <div key={i} style={{ marginBottom: 4, fontSize: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ marginTop: 2, flexShrink: 0, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: c.required ? "#dbeafe" : "var(--bg)", color: c.required ? "#1d4ed8" : "var(--text3)", border: "1px solid", borderColor: c.required ? "#93c5fd" : "var(--border)" }}>
                          {c.required ? "required" : "nice-to-have"}
                        </span>
                        <div>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          <span style={{ color: "var(--text3)", marginLeft: 4 }}>— {c.signal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
