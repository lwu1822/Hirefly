"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, Company } from "@/lib/data";
import { COMPANY_COLORS } from "@/lib/data";
import Sidebar from "@/components/Sidebar";
import { Users, ChevronDown, ChevronRight, RotateCcw, Plus, Building2 } from "lucide-react";

type RoleWithCount = Role & { candidateCount: number };

const LEVEL_COLOR: Record<string, { bg: string; text: string }> = {
  L4: { bg: "#f0fdf4", text: "#15803d" },
  L5: { bg: "#eff6ff", text: "#1d4ed8" },
  L6: { bg: "#fdf4ff", text: "#7e22ce" },
  L7: { bg: "#fff7ed", text: "#c2410c" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COMPANY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then(r => r.json()),
      fetch("/api/roles").then(r => r.json()),
    ]).then(([cd, rd]) => {
      setCompanies(cd.companies);
      setRoles(rd.roles);
    });
  }, []);

  async function createCompany() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/companies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    const d = await res.json();
    setCompanies(prev => [...prev, d.company]);
    setNewName(""); setNewColor(COMPANY_COLORS[0]); setCreating(false);
    setSaving(false);
  }

  async function handleDeleteCompany(e: React.MouseEvent, companyId: string, companyName: string) {
    e.stopPropagation();
    if (!confirm(`Delete "${companyName}"? Roles inside will become uncategorized.`)) return;
    await fetch(`/api/companies/${companyId}`, { method: "DELETE" });
    setCompanies(prev => prev.filter(c => c.id !== companyId));
  }

  async function closeRole(e: React.MouseEvent, roleId: string) {
    e.stopPropagation();
    if (!confirm("Close this role? You can reopen it later.")) return;
    await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, status: "closed" } : r));
  }

  async function reopenRole(e: React.MouseEvent, roleId: string) {
    e.stopPropagation();
    await fetch(`/api/roles/${roleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, status: "open" } : r));
  }

  const openRoles = roles.filter(r => r.status !== "closed");
  const closedRoles = roles.filter(r => r.status === "closed");
  const totalCandidates = openRoles.reduce((a, r) => a + r.candidateCount, 0);

  // Roles without a company
  const ungrouped = openRoles.filter(r => !r.companyId);

  return (
    <div className="app-layout">
      <Sidebar active="roles" />
      <div className="main">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/hirefly-logo.svg" alt="Hirefly" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Hirefly</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: -2 }}>Recruiting Dashboard</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--text2)", background: "var(--bg2)", padding: "5px 14px", borderRadius: 8, fontWeight: 500 }}>
              {companies.length} companies · {openRoles.length} roles · {totalCandidates} candidates
            </div>
            <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ gap: 6 }}>
              <Building2 size={15} strokeWidth={2.5} />
              Add Company
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Companies</div>
            <div style={{ fontSize: 14, color: "var(--text2)" }}>Manage hiring pipelines by company — click a role to view ranked candidates</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
            {companies.map(company => {
              const companyRoles = openRoles.filter(r => r.companyId === company.id);
              const total = companyRoles.reduce((a, r) => a + r.candidateCount, 0);
              return (
                <div
                  key={company.id}
                  style={{ background: "var(--bg3)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                >
                  {/* Header */}
                  <div style={{ background: company.color, padding: "20px 22px 16px", position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em", marginBottom: 4 }}>{company.name}</div>
                      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 500 }}>
                        {companyRoles.length} {companyRoles.length === 1 ? "role" : "roles"} · {total} candidates
                      </div>
                    </div>
                    <button
                      onClick={e => handleDeleteCompany(e, company.id, company.name)}
                      style={{ background: "rgba(0,0,0,0.2)", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 12, padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.6)"; (e.currentTarget as HTMLButtonElement).style.color = "white"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.2)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Role rows */}
                  <div style={{ padding: "6px 0" }}>
                    {companyRoles.length === 0 ? (
                      <div style={{ padding: "16px 22px", color: "var(--text3)", fontSize: 13 }}>No open roles — add one below</div>
                    ) : companyRoles.map(role => {
                      const lv = LEVEL_COLOR[role.level] ?? { bg: "var(--bg2)", text: "var(--text2)" };
                      return (
                        <div
                          key={role.id}
                          onClick={() => router.push(`/dashboard/${role.id}`)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", cursor: "pointer", transition: "background 0.1s", borderBottom: "1px solid var(--border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--bg2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: lv.bg, color: lv.text, flexShrink: 0 }}>{role.level}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role.title}</div>
                            <div style={{ fontSize: 11, color: "var(--text3)" }}>{role.team}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                            <Users size={12} color="var(--text3)" />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{role.candidateCount}</span>
                          </div>
                          <button
                            onClick={e => closeRole(e, role.id)}
                            style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text3)", cursor: "pointer", flexShrink: 0 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--red-bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--red-text)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
                          >
                            Close
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "10px 14px" }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => router.push(`/dashboard/new?companyId=${company.id}`)}
                      style={{ width: "100%", justifyContent: "center", fontSize: 12, gap: 5 }}
                    >
                      <Plus size={13} strokeWidth={2.5} /> Add Role
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Ungrouped roles card */}
            {ungrouped.length > 0 && (
              <div style={{ background: "var(--bg3)", borderRadius: 16, overflow: "hidden", border: "1px dashed var(--border2)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ background: "var(--bg2)", padding: "20px 22px 16px" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text2)", marginBottom: 4 }}>Uncategorized</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{ungrouped.length} roles · not assigned to a company</div>
                </div>
                <div style={{ padding: "6px 0" }}>
                  {ungrouped.map(role => {
                    const lv = LEVEL_COLOR[role.level] ?? { bg: "var(--bg2)", text: "var(--text2)" };
                    return (
                      <div
                        key={role.id}
                        onClick={() => router.push(`/dashboard/${role.id}`)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", cursor: "pointer", transition: "background 0.1s", borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: lv.bg, color: lv.text, flexShrink: 0 }}>{role.level}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{role.title}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)" }}>{role.team}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Users size={12} color="var(--text3)" />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{role.candidateCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Create new company card */}
            <div
              onClick={() => setCreating(true)}
              style={{ background: "transparent", borderRadius: 16, border: "2px dashed var(--border2)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 200, color: "var(--text3)", transition: "all 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#0d9488"; el.style.color = "#0d9488"; el.style.background = "var(--blue-bg)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border2)"; el.style.color = "var(--text3)"; el.style.background = "transparent"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: "2px dashed currentColor", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={22} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Add Company</span>
            </div>
          </div>

          {/* Closed roles */}
          {closedRoles.length > 0 && (
            <div>
              <button
                onClick={() => setShowClosed(s => !s)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginBottom: 16, fontFamily: "inherit" }}
              >
                {showClosed ? <ChevronDown size={16} color="var(--text2)" /> : <ChevronRight size={16} color="var(--text2)" />}
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)" }}>Closed Roles</span>
                <span style={{ fontSize: 12, background: "var(--bg2)", color: "var(--text3)", padding: "1px 8px", borderRadius: 10, fontWeight: 500 }}>{closedRoles.length}</span>
              </button>
              {showClosed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {closedRoles.map(role => {
                    const co = companies.find(c => c.id === role.companyId);
                    return (
                      <div key={role.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, opacity: 0.8 }}>
                        <div style={{ width: 4, height: 40, borderRadius: 4, background: co?.color ?? "var(--bg2)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{role.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>{co?.name ?? "—"} · {role.team} · {role.level} · {role.candidateCount} candidates</div>
                        </div>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "var(--bg2)", color: "var(--text3)", fontWeight: 500, flexShrink: 0 }}>Closed</span>
                        <button onClick={e => reopenRole(e, role.id)} className="btn btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, color: "#0d9488", borderColor: "#0d9488" }}>
                          <RotateCcw size={13} /> Reopen
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create company modal */}
      {creating && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setCreating(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--bg3)", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Add Company</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Create a company to group roles under</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Company name</div>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") createCompany(); if (e.key === "Escape") setCreating(false); }}
                placeholder="e.g. Google, Meta, Stripe…"
                style={{ width: "100%", padding: "9px 12px", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 10 }}>Card color</div>
              <div style={{ display: "flex", gap: 10 }}>
                {COMPANY_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: newColor === c ? "3px solid var(--text1)" : "3px solid transparent", transition: "border 0.1s" }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            {newName && (
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 20 }}>
                <div style={{ background: newColor, padding: "16px 18px 12px" }}>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 17 }}>{newName}</div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>0 roles · 0 candidates</div>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--bg2)", fontSize: 12, color: "var(--text3)" }}>Roles appear here</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }} onClick={() => setCreating(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 2, justifyContent: "center" }}
                onClick={createCompany}
                disabled={!newName.trim() || saving}
              >
                {saving ? "Creating…" : "Create Company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
