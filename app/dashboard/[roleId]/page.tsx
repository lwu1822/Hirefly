"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, Role, RubricWeights } from "@/lib/data";
import Sidebar from "@/components/Sidebar";
import CandidateDetail from "@/components/CandidateDetail";

const ATTR_LABELS: Record<string, string> = { gca: "General Cognitive Ability", rrk: "Role-Related Knowledge", leadership: "Leadership", googleyness: "Googleyness" };
const ATTR_COLORS: Record<string, string> = { gca: "#2563eb", rrk: "#16a34a", leadership: "#d97706", googleyness: "#7c3aed" };

function pct(v: number) { return Math.round(v * 100); }
function scoreClass(s: number) { return s >= 0.80 ? "high" : s >= 0.65 ? "med" : "low"; }
const SCORE_STYLES: Record<string, React.CSSProperties> = {
  high: { background: "var(--green-bg)", color: "var(--green-text)" },
  med: { background: "var(--amber-bg)", color: "var(--amber-text)" },
  low: { background: "var(--red-bg)", color: "var(--red-text)" },
};

const AVATAR_COLORS = [
  ["#dbeafe","#1d4ed8"],["#dcfce7","#15803d"],["#fef3c7","#92400e"],
  ["#ede9fe","#6d28d9"],["#fee2e2","#dc2626"],["#fce7f3","#9d174d"],
  ["#ecfdf5","#065f46"],["#fff7ed","#9a3412"],["#f0f9ff","#0369a1"],["#fdf4ff","#7e22ce"],
];
function initials(n: string) { return n.split(" ").map(w=>w[0]).join("").slice(0,2); }

export default function RolePipelinePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [candidates, setCandidates] = useState<(Candidate & { overall: number })[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rubric, setRubric] = useState<RubricWeights>({ gca: 25, rrk: 35, leadership: 20, googleyness: 20 });
  const [search, setSearch] = useState("");
  const [reranking, setReranking] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [batchScoring, setBatchScoring] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    fetch(`/api/roles`).then(r => r.json()).then(d => {
      const r = d.roles.find((x: Role) => x.id === roleId);
      if (r) { setRole(r); setRubric(r.rubric); }
    });
    fetch(`/api/roles/${roleId}/candidates`).then(r => r.json()).then(d => {
      setCandidates(d.candidates);
      if (d.candidates.length > 0) setSelected(d.candidates[0].id);
    });
  }, [roleId]);

  const rerank = useCallback(async (newRubric: RubricWeights) => {
    setReranking(true);
    const res = await fetch("/api/candidates/rerank", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId, rubric: newRubric }),
    });
    const d = await res.json();
    setCandidates(d.candidates);
    setReranking(false);
  }, [roleId]);

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleWeightChange(key: keyof RubricWeights, val: number) {
    const next = { ...rubric, [key]: val };
    setRubric(next);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => rerank(next), 500);
  }

  async function handleAction(candidateId: string, action: "advanced" | "rejected") {
    await fetch("/api/candidates/score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: candidateId, status: action }),
    });
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    setSelected(null); setShowDetail(false);
  }

  function handleScored(
    candidateId: string,
    scores: { gca: number; rrk: number; leadership: number; googleyness: number; evidence: string[] }
  ) {
    setCandidates(prev => {
      const updated = prev.map(c => {
        if (c.id !== candidateId) return c;
        const next = { ...c, ...scores };
        const total = rubric.gca + rubric.rrk + rubric.leadership + rubric.googleyness;
        next.overall = total === 0 ? 0 : (
          next.gca * rubric.gca + next.rrk * rubric.rrk +
          next.leadership * rubric.leadership + next.googleyness * rubric.googleyness
        ) / total;
        return next;
      });
      return [...updated].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
    });
  }

  async function handleScoreAll() {
    setBatchScoring(true);
    setBatchProgress({ done: 0, total: candidates.length });
    for (const cand of candidates) {
      try {
        const res = await fetch("/api/candidates/ai-score", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId: cand.id, roleId }),
        });
        const d = await res.json();
        if (!d.error) handleScored(cand.id, d);
      } catch { /* skip failed */ }
      setBatchProgress(p => ({ ...p, done: p.done + 1 }));
    }
    setBatchScoring(false);
  }

  const filtered = candidates.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedCand = candidates.find(c => c.id === selected);

  return (
    <div className="app-layout">
      <Sidebar active="roles" />
      <div className="main">
        <div className="topbar">
          <button className="btn btn-sm" onClick={() => router.push("/dashboard")} style={{ padding: "4px 10px" }}>← Back</button>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{role?.title ?? "Loading…"}</span>
          {role && <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: "var(--blue-bg)", color: "var(--blue-text)", fontWeight: 500 }}>{role.team}</span>}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{reranking ? "⟳ Re-ranking…" : `${filtered.length} candidates ranked`}</span>
          <button
            className="btn btn-danger btn-sm"
            onClick={async () => {
              if (!confirm("Close this role? It will be removed from the dashboard.")) return;
              await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
              router.push("/dashboard");
            }}
          >
            Close Role
          </button>
        </div>
        <div className="content-area">
          {/* Candidate list */}
          <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg3)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, company, skill…" style={{ width: "100%", padding: "6px 10px" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map((c, i) => {
                const avatarIdx = Math.abs(c.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % 10;
                const [bg, fg] = AVATAR_COLORS[avatarIdx];
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelected(c.id); setShowDetail(true); }}
                    style={{
                      padding: "10px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                      background: selected === c.id ? "var(--blue-bg)" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: i<3?"#dbeafe":"var(--bg2)", color: i<3?"#1d4ed8":"var(--text3)", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {i===0?"★":i+1}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 8, ...SCORE_STYLES[scoreClass(c.overall)] }}>{pct(c.overall)}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 5 }}>{c.title} · {c.company}</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {(["gca","rrk","leadership","googleyness"] as const).map(k => (
                        <div key={k} style={{ flex: 1 }}>
                          <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 1 }}>{k.toUpperCase().slice(0,3)}</div>
                          <div style={{ height: 3, background: "var(--bg2)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct(c[k])}%`, height: "100%", background: ATTR_COLORS[k], borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No candidates match your search.</div>}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            {selectedCand && showDetail
              ? <CandidateDetail candidate={selectedCand} roleId={roleId} rank={filtered.findIndex(c=>c.id===selectedCand.id)+1} onAction={handleAction} onScored={handleScored} />
              : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text3)", fontSize: 14 }}>Select a candidate to view details</div>
            }
          </div>

          {/* Live rubric editor */}
          <div style={{ width: 256, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg3)", padding: 16, overflowY: "auto" }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Live Rubric Editor</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16 }}>Drag to reweight — list re-ranks automatically</div>
            {(["gca","rrk","leadership","googleyness"] as const).map(k => (
              <div key={k} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {k === "gca" ? "GCA" : k === "rrk" ? "RRK" : k === "googleyness" ? "Googleyness" : "Leadership"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ATTR_COLORS[k] }}>{rubric[k]}%</span>
                </div>
                <input type="range" min="5" max="60" step="1" value={rubric[k]}
                  onChange={e => handleWeightChange(k, parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ATTR_COLORS[k] }} />
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ATTR_LABELS[k]}</div>
              </div>
            ))}
            {reranking && (
              <div style={{ fontSize: 12, color: "var(--blue-text)", background: "var(--blue-bg)", padding: "6px 10px", borderRadius: 6, textAlign: "center", marginTop: 4 }}>
                ⟳ Re-ranking candidates…
              </div>
            )}
            <button
              className="btn btn-sm"
              onClick={handleScoreAll}
              disabled={batchScoring}
              style={{ width: "100%", justifyContent: "center", marginTop: 8, background: "var(--blue-bg)", color: "var(--blue-text)", border: "1px solid var(--blue-text)", opacity: batchScoring ? 0.7 : 1 }}
            >
              {batchScoring
                ? `⟳ Scoring ${batchProgress.done}/${batchProgress.total}…`
                : "✦ Score All with AI"}
            </button>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Criteria</div>
              {[
                ["Distributed systems ownership", "Owned a service end-to-end in prod"],
                ["Technical depth", "5+ yrs backend engineering"],
                ["Leadership signal", "Mentored engineers or led projects"],
                ["Culture alignment", "Collaborative, curious, team-first"],
              ].map(([name, signal]) => (
                <div key={name} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.4 }}>{signal}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-sm" style={{ width: "100%", marginTop: 4, justifyContent: "center" }}
              onClick={() => alert("CSV export ready!")}>
              ↓ Export rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
