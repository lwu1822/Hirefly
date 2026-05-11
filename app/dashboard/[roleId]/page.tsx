"use client";
import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, Role, RubricWeights, RoleCriteria, RoleLabels, CustomCategory } from "@/lib/data";
import { DEFAULT_CRITERIA, DEFAULT_LABELS } from "@/lib/data";
import Sidebar from "@/components/Sidebar";
import CandidateDetail from "@/components/CandidateDetail";

interface CandidateRowProps {
  c: Candidate & { overall: number };
  rank: number;
  selected: string | null;
  setSelected: (id: string) => void;
  setShowDetail: (show: boolean) => void;
  folders: string[];
  assignFolder: (candidateId: string, folder: string | null) => Promise<void>;
  AVATAR_COLORS: string[][];
  SCORE_STYLES: Record<string, React.CSSProperties>;
  scoreClass: (s: number) => string;
  pct: (v: number) => number;
}

function CandidateRow({ c, rank, selected, setSelected, setShowDetail, folders, assignFolder, AVATAR_COLORS, SCORE_STYLES, scoreClass, pct }: CandidateRowProps) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const colorIdx = Math.abs(c.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % 10;
  const [bg, fg] = AVATAR_COLORS[colorIdx];
  const isSelected = selected === c.id;
  const sc = scoreClass(c.overall);

  return (
    <div
      onClick={() => { setSelected(c.id); setShowDetail(true); }}
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: isSelected ? "var(--blue-bg)" : "transparent",
        borderLeft: isSelected ? "3px solid var(--blue-text)" : "3px solid transparent",
        transition: "background 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          {c.name.split(" ").map((w: string) => w[0]).join("").slice(0,2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          <div style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title} · {c.company}</div>
        </div>
        <div style={{ ...SCORE_STYLES[sc], fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 8, flexShrink: 0 }}>{pct(c.overall)}%</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, paddingLeft: 44 }}>
        {c.folder && (
          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "#fef3c7", color: "#92400e", fontWeight: 500 }}>📁 {c.folder}</span>
        )}
        <div style={{ position: "relative" }}>
          <button
            onClick={e => { e.stopPropagation(); setShowFolderMenu(v => !v); }}
            style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "var(--bg2)", color: "var(--text3)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            {c.folder ? "Move" : "📁 Add to folder"}
          </button>
          {showFolderMenu && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: 24, left: 0, zIndex: 100, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 150, padding: 4 }}
            >
              {folders.length === 0 && (
                <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--text3)" }}>No folders yet — create one in the panel →</div>
              )}
              {folders.map(f => (
                <div
                  key={f}
                  onClick={() => { assignFolder(c.id, f); setShowFolderMenu(false); }}
                  style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", borderRadius: 6, background: c.folder === f ? "var(--blue-bg)" : "transparent", color: c.folder === f ? "var(--blue-text)" : "var(--text1)" }}
                >
                  📁 {f}
                </div>
              ))}
              {c.folder && (
                <div
                  onClick={() => { assignFolder(c.id, null); setShowFolderMenu(false); }}
                  style={{ padding: "6px 10px", fontSize: 12, cursor: "pointer", borderRadius: 6, color: "var(--red-text)" }}
                >
                  ✕ Remove from folder
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [criteria, setCriteria] = useState<RoleCriteria>(DEFAULT_CRITERIA);
  const [labels, setLabels] = useState<RoleLabels>(DEFAULT_LABELS);
  const [criteriaChanged, setCriteriaChanged] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "company">("none");
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatCriteria, setNewCatCriteria] = useState("");
  const [newCatWeight, setNewCatWeight] = useState(20);

  useEffect(() => {
    fetch(`/api/roles`).then(r => r.json()).then(d => {
      const r = d.roles.find((x: Role) => x.id === roleId);
      if (r) { setRole(r); setRubric(r.rubric); setCriteria({ ...DEFAULT_CRITERIA, ...r.criteria }); setLabels({ ...DEFAULT_LABELS, ...r.labels }); setCustomCategories(r.customCategories ?? []); }
    });
    fetch(`/api/roles/${roleId}/candidates`).then(r => r.json()).then(d => {
      setCandidates(d.candidates);
      if (d.candidates.length > 0) setSelected(d.candidates[0].id);
      refreshFolders(d.candidates);
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
    scores: { gca: number; rrk: number; leadership: number; googleyness: number; evidence: string[]; customScores?: Record<string, number> }
  ) {
    setCandidates(prev => {
      const updated = prev.map(c => {
        if (c.id !== candidateId) return c;
        const next = { ...c, ...scores, customScores: scores.customScores ?? c.customScores };
        const baseTotal = rubric.gca + rubric.rrk + rubric.leadership + rubric.googleyness;
        const customTotal = customCategories.reduce((a, cat) => a + cat.weight, 0);
        const total = baseTotal + customTotal;
        const baseSum = next.gca * rubric.gca + next.rrk * rubric.rrk + next.leadership * rubric.leadership + next.googleyness * rubric.googleyness;
        const customSum = customCategories.reduce((a, cat) => a + (next.customScores?.[cat.key] ?? 0) * cat.weight, 0);
        next.overall = total === 0 ? 0 : (baseSum + customSum) / total;
        return next;
      });
      return [...updated].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
    });
  }

  async function saveCustomCategories(cats: CustomCategory[]) {
    await fetch(`/api/roles/${roleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customCategories: cats }),
    });
  }

  async function addCustomCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const key = `custom_${label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}_${Date.now()}`;
    const cat: CustomCategory = { key, label, weight: newCatWeight, criteria: newCatCriteria.trim() || label };
    const updated = [...customCategories, cat];
    setCustomCategories(updated);
    await saveCustomCategories(updated);
    setAddingCat(false); setNewCatLabel(""); setNewCatCriteria(""); setNewCatWeight(20);
  }

  async function removeCustomCategory(key: string) {
    const updated = customCategories.filter(c => c.key !== key);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
  }

  async function updateCustomCatWeight(key: string, weight: number) {
    const updated = customCategories.map(c => c.key === key ? { ...c, weight } : c);
    setCustomCategories(updated);
    await saveCustomCategories(updated);
  }

  async function saveCriteria() {
    setSavingCriteria(true);
    await fetch(`/api/roles/${roleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ criteria, labels }),
    });
    setSavingCriteria(false);
    setCriteriaChanged(false);
  }

  function refreshFolders(cands: (Candidate & { overall: number })[]) {
    const seen = new Set<string>();
    cands.forEach(c => { if (c.folder) seen.add(c.folder); });
    setFolders([...seen].sort());
  }

  async function assignFolder(candidateId: string, folder: string | null) {
    await fetch("/api/candidates/folder", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, folder }),
    });
    setCandidates(prev => {
      const updated = prev.map(c => c.id === candidateId ? { ...c, folder: folder ?? undefined } : c);
      refreshFolders(updated);
      return updated;
    });
  }

  function createFolder() {
    const name = newFolderName.trim();
    if (!name || folders.includes(name)) return;
    setFolders(prev => [...prev, name].sort());
    setNewFolderName("");
    setAddingFolder(false);
  }

  async function deleteFolder(name: string) {
    if (!confirm(`Delete folder "${name}"? Candidates will be unassigned.`)) return;
    const inFolder = candidates.filter(c => c.folder === name);
    await Promise.all(inFolder.map(c => assignFolder(c.id, null)));
    if (activeFolder === name) setActiveFolder(null);
  }

  async function createFolderForCompany(company: string, cands: (Candidate & { overall: number })[]) {
    if (!folders.includes(company)) {
      setFolders(prev => [...prev, company].sort());
    }
    await Promise.all(cands.map(c => assignFolder(c.id, company)));
  }

  async function createAllCompanyFolders() {
    const groups = Object.entries(
      candidates.reduce<Record<string, (Candidate & { overall: number })[]>>((acc, c) => {
        const key = c.company || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
      }, {})
    );
    for (const [company, cands] of groups) {
      await createFolderForCompany(company, cands);
    }
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

  const filtered = candidates.filter(c => {
    if (activeFolder !== null && c.folder !== activeFolder) return false;
    if (!search) return true;
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const displayed = limit !== null ? filtered.slice(0, limit) : filtered;

  // For company grouping
  const byCompany = displayed.reduce<Record<string, typeof filtered>>((acc, c) => {
    const key = c.company || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
  const companyGroups = Object.entries(byCompany).sort((a, b) => b[1].length - a[1].length);

  const selectedCand = candidates.find(c => c.id === selected);

  return (
    <div className="app-layout">
      <Sidebar active="roles" />
      <div className="main">
        <div className="topbar">
          <button className="btn btn-sm" onClick={() => router.push("/dashboard")} style={{ gap: 5 }}>← Back</button>
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>{role?.title ?? "Loading…"}</div>
            {role && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{role.team} · {role.level}</div>}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: reranking ? "var(--blue-text)" : "var(--text3)", fontWeight: reranking ? 500 : 400 }}>
            {reranking ? "⟳ Re-ranking…" : limit !== null && displayed.length < filtered.length ? `Top ${displayed.length} of ${filtered.length}` : `${filtered.length} candidates`}
          </span>
          <button
            className="btn btn-sm"
            onClick={async () => {
              if (!confirm("Close this role? You can reopen it from the dashboard.")) return;
              await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
              router.push("/dashboard");
            }}
            style={{ color: "var(--red-text)", borderColor: "transparent" }}
          >
            Close Role
          </button>
        </div>
        <div className="content-area">
          {/* Candidate list */}
          <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg3)" }}>
            {/* Search + toolbar */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…" style={{ width: "100%", padding: "7px 12px", fontSize: 13, marginBottom: 8 }} />
              {/* Top-N filter */}
              <div style={{ display: "flex", gap: 4, marginBottom: 6, background: "var(--bg2)", borderRadius: 8, padding: 3 }}>
                {([null, 5, 10, 20, 50] as (number | null)[]).map(n => (
                  <button
                    key={String(n)}
                    onClick={() => setLimit(n)}
                    style={{ flex: 1, fontSize: 11, padding: "3px 0", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: limit === n ? 700 : 400, background: limit === n ? "var(--bg3)" : "transparent", color: limit === n ? "var(--text1)" : "var(--text3)", boxShadow: limit === n ? "var(--shadow-sm)" : "none", transition: "all 0.1s" }}
                  >
                    {n === null ? "All" : `Top ${n}`}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                {/* Group by toggle */}
                <button
                  className="btn btn-sm"
                  onClick={() => { setGroupBy(g => g === "none" ? "company" : "none"); setActiveFolder(null); }}
                  style={{ fontSize: 11, padding: "3px 10px", background: groupBy === "company" ? "var(--blue-bg)" : "transparent", color: groupBy === "company" ? "var(--blue-text)" : "var(--text2)", border: "1px solid var(--border)" }}
                >
                  {groupBy === "company" ? "⊞ By Company" : "⊟ Flat List"}
                </button>
                {groupBy === "company" && (
                  <button
                    className="btn btn-sm"
                    onClick={createAllCompanyFolders}
                    style={{ fontSize: 11, padding: "3px 10px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}
                  >
                    📁 Folder all companies
                  </button>
                )}
                {/* Active folder chip */}
                {activeFolder && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: 10, fontWeight: 500 }}>
                    📁 {activeFolder}
                    <button onClick={() => setActiveFolder(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {groupBy === "company"
                ? companyGroups.map(([company, cands]) => (
                    <div key={company}>
                      <div style={{ padding: "8px 14px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ flex: 1 }}>{company}</span>
                        <span style={{ fontWeight: 500, fontSize: 10 }}>{cands.length}</span>
                        <button
                          onClick={e => { e.stopPropagation(); createFolderForCompany(company, cands); }}
                          title={`Create folder for ${company}`}
                          style={{ fontSize: 11, padding: "1px 6px", borderRadius: 6, background: folders.includes(company) ? "#fef3c7" : "var(--bg2)", color: folders.includes(company) ? "#92400e" : "var(--text3)", border: "1px solid var(--border)", cursor: "pointer", fontWeight: 500 }}
                        >
                          {folders.includes(company) ? "📁 ✓" : "📁"}
                        </button>
                      </div>
                      {cands.map(c => <CandidateRow key={c.id} c={c} rank={filtered.indexOf(c)} selected={selected} setSelected={setSelected} setShowDetail={setShowDetail} folders={folders} assignFolder={assignFolder} AVATAR_COLORS={AVATAR_COLORS} SCORE_STYLES={SCORE_STYLES} scoreClass={scoreClass} pct={pct} />)}
                    </div>
                  ))
                : displayed.map((c) => <CandidateRow key={c.id} c={c} rank={filtered.indexOf(c)} selected={selected} setSelected={setSelected} setShowDetail={setShowDetail} folders={folders} assignFolder={assignFolder} AVATAR_COLORS={AVATAR_COLORS} SCORE_STYLES={SCORE_STYLES} scoreClass={scoreClass} pct={pct} />)
              }
              {filtered.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No candidates match.</div>
              )}
              {filtered.length > 0 && displayed.length < filtered.length && (
                <div style={{ padding: "10px 14px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>Showing {displayed.length} of {filtered.length} · </span>
                  <span style={{ fontSize: 11, color: "var(--blue-text)", cursor: "pointer", textDecoration: "underline" }} onClick={() => setLimit(null)}>Show all</span>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
            {selectedCand && showDetail
              ? <CandidateDetail candidate={selectedCand} roleId={roleId} rank={filtered.findIndex(c=>c.id===selectedCand.id)+1} onAction={handleAction} onScored={handleScored} labels={labels} customCategories={customCategories} rubric={role?.rubric} />
              : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text3)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Select a candidate</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>Click any row in the list to view their profile</div>
                </div>
            }
          </div>

          {/* Live rubric editor */}
          <div style={{ width: 264, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg3)", padding: "18px 16px", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em", marginBottom: 3 }}>Rubric Editor</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 18, lineHeight: 1.4 }}>Drag weights — list re-ranks live</div>
            {(["gca","rrk","leadership","googleyness"] as const).map(k => (
              <div key={k} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {labels[k]}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ATTR_COLORS[k] }}>{rubric[k]}%</span>
                </div>
                <input type="range" min="5" max="60" step="1" value={rubric[k]}
                  onChange={e => handleWeightChange(k, parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ATTR_COLORS[k] }} />
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{ATTR_LABELS[k]}</div>
              </div>
            ))}
            {/* Custom categories */}
            {customCategories.map(cat => (
              <div key={cat.key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{cat.weight}%</span>
                    <button onClick={() => removeCustomCategory(cat.key)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", fontSize: 14, lineHeight: 1, padding: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--red-text)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>×</button>
                  </div>
                </div>
                <input type="range" min="5" max="60" step="1" value={cat.weight}
                  onChange={e => updateCustomCatWeight(cat.key, parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#7c3aed" }} />
                <div style={{ fontSize: 10, color: "var(--text3)", fontStyle: "italic" }}>{cat.criteria.slice(0, 60)}{cat.criteria.length > 60 ? "…" : ""}</div>
              </div>
            ))}

            {/* Add custom category */}
            {addingCat ? (
              <div style={{ background: "var(--bg2)", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid var(--border)" }}>
                <input
                  autoFocus
                  value={newCatLabel}
                  onChange={e => setNewCatLabel(e.target.value)}
                  placeholder="Category name…"
                  style={{ width: "100%", fontSize: 12, padding: "4px 7px", marginBottom: 6 }}
                />
                <textarea
                  value={newCatCriteria}
                  onChange={e => setNewCatCriteria(e.target.value)}
                  placeholder="What does AI look for? (optional)"
                  rows={2}
                  style={{ width: "100%", fontSize: 11, padding: "4px 7px", resize: "none", marginBottom: 6 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>Weight:</span>
                  <input type="range" min="5" max="60" step="1" value={newCatWeight} onChange={e => setNewCatWeight(parseInt(e.target.value))} style={{ flex: 1, accentColor: "#7c3aed" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed" }}>{newCatWeight}%</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => { setAddingCat(false); setNewCatLabel(""); }}>Cancel</button>
                  <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center", fontSize: 11, background: "var(--blue-bg)", color: "var(--blue-text)", border: "1px solid var(--blue-text)" }} onClick={addCustomCategory} disabled={!newCatLabel.trim()}>Add</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-sm" style={{ width: "100%", justifyContent: "center", marginBottom: 10, fontSize: 11, borderStyle: "dashed" }} onClick={() => setAddingCat(true)}>
                + Add Category
              </button>
            )}

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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Scoring Criteria</div>
                {criteriaChanged && (
                  <button
                    className="btn btn-sm"
                    onClick={saveCriteria}
                    disabled={savingCriteria}
                    style={{ fontSize: 10, padding: "2px 8px", background: "var(--blue-bg)", color: "var(--blue-text)", border: "1px solid var(--blue-text)" }}
                  >
                    {savingCriteria ? "Saving…" : "Save"}
                  </button>
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 10, lineHeight: 1.4 }}>
                Edit what each attribute looks for — used by AI when scoring candidates.
              </div>
              {(["gca","rrk","leadership","googleyness"] as const).map(k => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <input
                    value={labels[k]}
                    onChange={e => { setLabels(prev => ({ ...prev, [k]: e.target.value })); setCriteriaChanged(true); }}
                    style={{ width: "100%", fontSize: 11, fontWeight: 600, padding: "3px 6px", marginBottom: 4, color: ATTR_COLORS[k], borderBottom: `2px solid ${ATTR_COLORS[k]}`, borderTop: "none", borderLeft: "none", borderRight: "none", background: "transparent", outline: "none" }}
                    placeholder="Category name…"
                  />
                  <textarea
                    value={criteria[k]}
                    onChange={e => { setCriteria(prev => ({ ...prev, [k]: e.target.value })); setCriteriaChanged(true); }}
                    rows={3}
                    style={{ width: "100%", fontSize: 11, padding: "6px 8px", resize: "vertical", lineHeight: 1.5, borderLeft: `2px solid ${ATTR_COLORS[k]}`, borderRadius: "0 4px 4px 0" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Folders</div>
                <button
                  className="btn btn-sm"
                  onClick={() => setAddingFolder(true)}
                  style={{ fontSize: 10, padding: "2px 8px" }}
                >
                  + New
                </button>
              </div>
              {addingFolder && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") createFolder();
                      if (e.key === "Escape") { setAddingFolder(false); setNewFolderName(""); }
                    }}
                    placeholder="Folder name…"
                    style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                  />
                  <button className="btn btn-sm" onClick={createFolder} style={{ fontSize: 11, padding: "3px 8px" }}>Add</button>
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                <div
                  onClick={() => setActiveFolder(null)}
                  style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, cursor: "pointer", background: activeFolder === null ? "var(--blue-bg)" : "var(--bg2)", color: activeFolder === null ? "var(--blue-text)" : "var(--text2)", border: "1px solid var(--border)", fontWeight: activeFolder === null ? 600 : 400 }}
                >
                  All
                </div>
                {folders.map(f => (
                  <div
                    key={f}
                    style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, padding: "3px 6px 3px 10px", borderRadius: 10, background: activeFolder === f ? "#fef3c7" : "var(--bg2)", color: activeFolder === f ? "#92400e" : "var(--text2)", border: "1px solid var(--border)", fontWeight: activeFolder === f ? 600 : 400 }}
                  >
                    <span onClick={() => setActiveFolder(f === activeFolder ? null : f)} style={{ cursor: "pointer" }}>📁 {f}</span>
                    <button
                      onClick={() => deleteFolder(f)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.5, padding: "0 2px", lineHeight: 1, fontSize: 13 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.color = "var(--red-text)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.5"; (e.currentTarget as HTMLButtonElement).style.color = "inherit"; }}
                    >×</button>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-sm" style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
              onClick={() => alert("CSV export ready!")}>
              ↓ Export rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
