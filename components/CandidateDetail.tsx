"use client";
import { useState } from "react";
import type { Candidate, RoleLabels, CustomCategory, RubricWeights } from "@/lib/data";
import { DEFAULT_LABELS } from "@/lib/data";

const ATTR_LABELS: Record<string, string> = { gca: "General Cognitive Ability", rrk: "Role-Related Knowledge", leadership: "Leadership", googleyness: "Googleyness" };
const ATTR_COLORS: Record<string, string> = { gca: "#2563eb", rrk: "#16a34a", leadership: "#d97706", googleyness: "#7c3aed" };
const ATTR_DESCRIPTIONS: Record<string, string> = {
  gca: "How quickly can this person learn and solve hard problems? Looks at academic trajectory, career growth rate, ability to operate in ambiguous or novel domains, and complexity of past technical decisions.",
  rrk: "Does this person have the hands-on technical chops the role actually needs? Evaluates depth in required languages, frameworks, and systems — not just keyword matches, but evidence of real ownership.",
  leadership: "Can this person drive outcomes beyond their immediate scope? Looks for mentorship, cross-team influence, owning projects end-to-end, and pushing initiatives forward without being told to.",
  googleyness: "Would this person thrive in a collaborative, fast-moving environment? Signals include intellectual curiosity, community contributions, ethical judgment, and comfort navigating ambiguity.",
};
const AVATAR_COLORS = ["#dbeafe #1d4ed8","#dcfce7 #15803d","#fef3c7 #92400e","#ede9fe #6d28d9","#fee2e2 #dc2626","#fce7f3 #9d174d","#ecfdf5 #065f46","#fff7ed #9a3412","#f0f9ff #0369a1","#fdf4ff #7e22ce"];

function pct(v: number) { return Math.round(v * 100); }
function initials(n: string) { return n.split(" ").map((w: string) => w[0]).join("").slice(0,2); }

interface Props {
  candidate: Candidate & { overall: number };
  roleId: string;
  rank: number;
  onAction: (id: string, action: "advanced" | "rejected") => void;
  onScored?: (id: string, scores: { gca: number; rrk: number; leadership: number; googleyness: number; evidence: string[]; customScores?: Record<string, number>; rationale?: Record<string, string> }) => void;
  labels?: RoleLabels;
  customCategories?: CustomCategory[];
  rubric?: RubricWeights;
}

export default function CandidateDetail({ candidate: c, roleId, rank, onAction, onScored, labels: labelsProp, customCategories = [], rubric }: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<{personalized:string,generic:string}|null>(null);
  const [loadingOutreach, setLoadingOutreach] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [aiScored, setAiScored] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [tone, setTone] = useState("warm");
  const [notes, setNotes] = useState("");
  const [showResume, setShowResume] = useState(false);
  const [localRationale, setLocalRationale] = useState<Record<string, string>>(c.rationale ?? {});
  const [similarRoles, setSimilarRoles] = useState<{roleId: string; title: string; team: string; level: string; score: number}[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [addedToRole, setAddedToRole] = useState<Set<string>>(new Set());

  const idx = Math.abs(c.id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
  const [bg, fg] = AVATAR_COLORS[idx % 10].split(" ");

  async function fetchOutreach() {
    setLoadingOutreach(true);
    try {
      const res = await fetch("/api/outreach/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: c.id, roleId, tone }),
      });
      const d = await res.json();
      setOutreach(d);
    } catch { setOutreach({ personalized: "Error generating outreach. Check GROQ_API_KEY.", generic: "" }); }
    setLoadingOutreach(false);
  }

  async function fetchSimilarRoles() {
    setLoadingSimilar(true);
    try {
      const res = await fetch(`/api/candidates/similar-roles?candidateId=${c.id}&roleId=${roleId}`);
      const d = await res.json();
      setSimilarRoles(d.matches || []);
    } catch { /* ignore */ }
    setLoadingSimilar(false);
  }

  async function addToRole(targetRoleId: string) {
    await fetch("/api/candidates/add-to-role", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId: c.id, roleId: targetRoleId }),
    });
    setAddedToRole(prev => new Set([...prev, targetRoleId]));
  }

  async function runAiScore() {
    setLoadingScore(true);
    setScoreError("");
    try {
      const res = await fetch("/api/candidates/ai-score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: c.id, roleId }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setAiScored(true);
      if (d.rationale) setLocalRationale(d.rationale);
      onScored?.(c.id, { gca: d.gca, rrk: d.rrk, leadership: d.leadership, googleyness: d.googleyness, evidence: d.evidence, customScores: d.customScores, rationale: d.rationale });
    } catch (e) {
      setScoreError(String(e));
    }
    setLoadingScore(false);
  }

  return (
    <div style={{ padding: 20, maxWidth: 780 }}>
      {/* Header */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600, flexShrink: 0 }}>
            {initials(c.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{c.name}</div>
              {aiScored && (
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: "#dcfce7", color: "#15803d", fontWeight: 600, border: "1px solid #86efac" }}>
                  ✦ AI-scored
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 8 }}>{c.title} at {c.company} · {c.school} · {c.yoe} years exp</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {c.skills.map(s => (
                <span key={s} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 10, background: "var(--bg2)", color: "var(--text2)", border: "1px solid var(--border)" }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{pct(c.overall)}%</div>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>overall · rank #{rank}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={() => onAction(c.id, "advanced")}>📞 Phone Screen</button>
          <button className="btn btn-sm" onClick={fetchOutreach}>✉ Draft Outreach</button>
          <button className="btn btn-sm" onClick={() => setShowResume(s=>!s)}>📄 {showResume?"Hide":"Show"} Resume</button>
          <button
            className="btn btn-sm"
            onClick={runAiScore}
            disabled={loadingScore}
            style={{ background: loadingScore ? "var(--bg2)" : "var(--blue-bg)", color: "var(--blue-text)", border: "1px solid var(--blue-text)", opacity: loadingScore ? 0.7 : 1 }}
          >
            {loadingScore ? "⟳ Scoring…" : "✦ Score with AI"}
          </button>
          <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={() => onAction(c.id, "rejected")}>✕ Reject</button>
        </div>
        {scoreError && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--red-text)", background: "var(--red-bg)", padding: "6px 10px", borderRadius: 6 }}>
            {scoreError}
          </div>
        )}
      </div>

      {/* Score breakdown */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>Score Breakdown</div>
          {aiScored && <span style={{ fontSize: 10, color: "#15803d", fontWeight: 500 }}>✦ AI-scored</span>}
        </div>

        {/* Score formula */}
        {rubric && (
          <div style={{ fontSize: 11, color: "var(--text3)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", marginBottom: 14, fontFamily: "monospace", lineHeight: 1.8 }}>
            <span style={{ fontWeight: 600, color: "var(--text2)", fontFamily: "inherit" }}>Overall = </span>
            {(["rrk","gca","leadership","googleyness"] as const)
              .filter(k => rubric[k] > 0)
              .map((k, i, arr) => (
                <span key={k}>
                  <span style={{ color: ATTR_COLORS[k], fontWeight: 600 }}>{rubric[k]}%</span>
                  <span style={{ color: "var(--text3)" }}>×{labels[k].split(" ").map(w=>w[0]).join("")}</span>
                  {i < arr.length - 1 ? <span style={{ color: "var(--text3)" }}> + </span> : null}
                </span>
              ))}
            {customCategories.map(cat => (
              <span key={cat.key}>
                <span style={{ color: "var(--text3)" }}> + </span>
                <span style={{ color: "#7c3aed", fontWeight: 600 }}>{cat.weight}%</span>
                <span style={{ color: "var(--text3)" }}>×{cat.label.split(" ").map((w:string)=>w[0]).join("")}</span>
              </span>
            ))}
          </div>
        )}

        {/* Base 4 categories */}
        {(["gca","rrk","leadership","googleyness"] as const).map(k => {
          const open = expandedAttr === k;
          const weight = rubric?.[k];
          const rationaleText = localRationale[k];
          return (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  onClick={() => setExpandedAttr(open ? null : k)}
                  style={{ width: 170, fontSize: 12, color: "var(--text1)", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}
                >
                  <span style={{ color: ATTR_COLORS[k], fontSize: 9 }}>{open ? "▼" : "▶"}</span>
                  {labels[k]}
                </div>
                <div style={{ flex: 1, height: 7, background: "var(--bg2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct(c[k])}%`, height: "100%", background: ATTR_COLORS[k], borderRadius: 4, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, width: 30, textAlign: "right", color: ATTR_COLORS[k] }}>{pct(c[k])}</div>
                {weight !== undefined && (
                  <div style={{ fontSize: 10, color: "var(--text3)", width: 36, textAlign: "right", flexShrink: 0 }}>{weight}% wt</div>
                )}
              </div>
              {open && (
                <div style={{ marginTop: 6, marginLeft: 14, borderLeft: `3px solid ${ATTR_COLORS[k]}`, paddingLeft: 10 }}>
                  {rationaleText ? (
                    <div style={{ fontSize: 12, color: "var(--text1)", background: "var(--blue-bg)", border: "1px solid var(--blue-border, var(--border))", borderRadius: 6, padding: "7px 10px", marginBottom: 6, lineHeight: 1.5 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--blue-text)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>AI Rationale</span>
                      {rationaleText}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", marginBottom: 6 }}>Run "Score with AI" to see why this score was given.</div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>Measures: </span>{ATTR_DESCRIPTIONS[k]}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom categories */}
        {customCategories.length > 0 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Role-Specific</div>
            {customCategories.map(cat => {
              const score = c.customScores?.[cat.key];
              const open = expandedAttr === cat.key;
              const unscored = score === undefined;
              const rationaleText = localRationale[cat.key];
              return (
                <div key={cat.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      onClick={() => setExpandedAttr(open ? null : cat.key)}
                      style={{ width: 170, fontSize: 12, color: unscored ? "var(--text3)" : "var(--text1)", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}
                    >
                      <span style={{ color: "#7c3aed", fontSize: 9 }}>{open ? "▼" : "▶"}</span>
                      {cat.label}
                    </div>
                    <div style={{ flex: 1, height: 7, background: "var(--bg2)", borderRadius: 4, overflow: "hidden" }}>
                      {unscored
                        ? <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)", borderRadius: 4 }} />
                        : <div style={{ width: `${pct(score)}%`, height: "100%", background: "#7c3aed", borderRadius: 4, transition: "width 0.4s" }} />
                      }
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, width: 30, textAlign: "right", color: unscored ? "var(--text3)" : "#7c3aed" }}>
                      {unscored ? "—" : pct(score)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", width: 36, textAlign: "right", flexShrink: 0 }}>{cat.weight}% wt</div>
                  </div>
                  {open && (
                    <div style={{ marginTop: 6, marginLeft: 14, borderLeft: "3px solid #7c3aed", paddingLeft: 10 }}>
                      {rationaleText ? (
                        <div style={{ fontSize: 12, color: "var(--text1)", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 6, padding: "7px 10px", marginBottom: 6, lineHeight: 1.5 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>AI Rationale</span>
                          {rationaleText}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", marginBottom: 6 }}>
                          {unscored ? "Not yet scored — click \"Score with AI\" to evaluate." : "Run \"Score with AI\" to see why this score was given."}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600 }}>Criteria: </span>{cat.criteria}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {customCategories.some(cat => c.customScores?.[cat.key] === undefined) && !aiScored && (
              <div style={{ fontSize: 11, color: "#7c3aed", background: "#fdf4ff", border: "1px solid #e9d5ff", padding: "6px 10px", borderRadius: 6, marginTop: 4 }}>
                Role-specific categories need scoring — click "Score with AI" above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evidence */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>Evidence from Resume</div>
          {aiScored && <span style={{ fontSize: 10, color: "#15803d", fontWeight: 500 }}>✦ AI-extracted</span>}
        </div>
        {c.evidence.map((e, i) => (
          <div key={i} style={{ background: "var(--bg2)", borderRadius: 8, padding: "10px 12px 10px 20px", marginBottom: 8, fontSize: 13, lineHeight: 1.5, position: "relative" }}>
            <div style={{ position: "absolute", left: 8, top: 18, width: 4, height: 4, borderRadius: "50%", background: "#2563eb" }} />
            {e}
          </div>
        ))}
      </div>

      {/* Similar Roles */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>Similar Roles</div>
          <button className="btn btn-sm" onClick={fetchSimilarRoles} disabled={loadingSimilar}>
            {loadingSimilar ? "Finding…" : similarRoles.length > 0 ? "Refresh" : "Find Matches →"}
          </button>
        </div>
        {similarRoles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {similarRoles.map(r => (
              <div key={r.roleId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg2)", borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.team} · {r.level}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--blue-text)", minWidth: 38, textAlign: "right" }}>{Math.round(r.score * 100)}%</div>
                <button
                  className="btn btn-sm"
                  onClick={() => addToRole(r.roleId)}
                  disabled={addedToRole.has(r.roleId)}
                  style={{ fontSize: 11, padding: "3px 10px", background: addedToRole.has(r.roleId) ? "var(--green-bg)" : "var(--blue-bg)", color: addedToRole.has(r.roleId) ? "var(--green-text)" : "var(--blue-text)", border: "1px solid currentColor" }}
                >
                  {addedToRole.has(r.roleId) ? "✓ Added" : "+ Add to Pipeline"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text3)" }}>
            Find other open roles this candidate matches based on their profile scores.
          </div>
        )}
      </div>

      {/* Resume text */}
      {showResume && (
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 12 }}>Raw Resume Text</div>
          <pre style={{ fontSize: 12, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--text1)", fontFamily: "monospace", margin: 0 }}>{c.resumeText}</pre>
        </div>
      )}

      {/* Outreach */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)" }}>Draft Outreach</div>
          <select value={tone} onChange={e => setTone(e.target.value)} style={{ padding: "3px 8px", fontSize: 12 }}>
            <option value="warm">Warm</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
          </select>
          <button className="btn btn-sm" onClick={fetchOutreach} disabled={loadingOutreach}>
            {loadingOutreach ? "Generating…" : "Generate with AI ↗"}
          </button>
        </div>
        {outreach ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 500 }}>Generic template</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text2)", background: "var(--bg2)", padding: 12, borderRadius: 8 }}>{outreach.generic}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--blue-text)", marginBottom: 6, fontWeight: 500 }}>✨ AI-personalized</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, background: "var(--blue-bg)", color: "var(--text1)", padding: 12, borderRadius: 8 }}>{outreach.personalized}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text3)" }}>Click "Generate with AI" to draft a personalized outreach message grounded in {c.name.split(" ")[0]}'s background.</div>
        )}
      </div>

      {/* Notes */}
      <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 10 }}>Recruiter Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add your notes about this candidate…" style={{ width: "100%", height: 80, padding: 10, resize: "none" }} />
      </div>
    </div>
  );
}
