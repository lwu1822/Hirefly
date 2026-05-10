"use client";
import Link from "next/link";

export default function Sidebar({ active }: { active: string }) {
  const items = [
    { key: "roles", label: "Open Roles", icon: "💼", href: "/dashboard" },
    { key: "new", label: "Create Role", icon: "+", href: "/dashboard/new" },
  ];
  return (
    <div className="sidebar">
      <div style={{ padding: "14px 16px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
        HireIQ
      </div>
      <div style={{ padding: "10px 8px", flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", padding: "4px 8px 6px" }}>Workspace</div>
        {items.map(item => (
          <Link key={item.key} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
              borderRadius: 6, marginBottom: 2, fontSize: 13, cursor: "pointer",
              background: active === item.key ? "var(--blue-bg)" : "transparent",
              color: active === item.key ? "var(--blue-text)" : "var(--text2)",
              fontWeight: active === item.key ? 600 : 400,
            }}>
              <span>{item.icon}</span>{item.label}
            </div>
          </Link>
        ))}
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", padding: "12px 8px 6px" }}>Settings</div>
        <Link href="/dashboard/import" style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
            borderRadius: 6, marginBottom: 2, fontSize: 13, cursor: "pointer",
            background: active === "import" ? "var(--blue-bg)" : "transparent",
            color: active === "import" ? "var(--blue-text)" : "var(--text2)",
            fontWeight: active === "import" ? 600 : 400,
          }}>
            <span>↑</span>Import Resumes
          </div>
        </Link>
        <div key="preferences" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 2, fontSize: 13, cursor: "pointer", color: "var(--text2)" }}
          onClick={() => alert("Preferences — coming soon")}>
          <span>⚙</span>Preferences
        </div>
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--blue-bg)", color: "var(--blue-text)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>JL</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Jamie Liu</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>recruiter@demo.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
