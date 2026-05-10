"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/data";
import Sidebar from "@/components/Sidebar";

type RoleWithCount = Role & { candidateCount: number };

export default function DashboardPage() {
  const [roles, setRoles] = useState<RoleWithCount[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/roles").then(r => r.json()).then(d => setRoles(d.roles));
  }, []);

  async function closeRole(e: React.MouseEvent, roleId: string) {
    e.stopPropagation();
    if (!confirm("Close this role? It will be removed from the dashboard.")) return;
    await fetch(`/api/roles/${roleId}`, { method: "DELETE" });
    setRoles(prev => prev.filter(r => r.id !== roleId));
  }

  return (
    <div className="app-layout">
      <Sidebar active="roles" />
      <div className="main">
        <div className="topbar">
          <span style={{ fontWeight: 600, fontSize: 15 }}>Recruiting Dashboard</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => router.push("/dashboard/new")}>
            + Create Role
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Open Roles</div>
            <div style={{ color: "var(--text2)", fontSize: 14 }}>{roles.length} active roles · {roles.reduce((a, r) => a + r.candidateCount, 0)} total candidates</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {roles.map(role => (
              <div
                key={role.id}
                onClick={() => router.push(`/dashboard/${role.id}`)}
                style={{
                  background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12,
                  padding: 20, cursor: "pointer", transition: "border-color 0.15s, transform 0.1s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--blue)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
              >
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{role.title}</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>{role.team} · {role.level}</div>
                <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{role.candidateCount}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>candidates</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{role.daysOpen}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>days open</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {role.candidateCount > 0
                    ? <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "var(--green-bg)", color: "var(--green-text)", fontWeight: 500 }}>Ranking complete</span>
                    : <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 10, background: "var(--bg2)", color: "var(--text3)" }}>No candidates</span>
                  }
                  <button
                    onClick={e => closeRole(e, role.id)}
                    style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--text3)", cursor: "pointer" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#dc2626"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)"; }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
