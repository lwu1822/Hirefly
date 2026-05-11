"use client";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [hovered, setHovered] = useState(false);
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{ height: 56, borderBottom: "1px solid var(--border)", background: "var(--bg3)", display: "flex", alignItems: "center", padding: "0 32px", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
          Hirefly
        </div>
        <div style={{ flex: 1 }} />
        <Link href="/login" style={{ textDecoration: "none" }}>
          <button className="btn btn-primary btn-sm">Get started →</button>
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2563eb", marginBottom: 16, background: "var(--blue-bg)", padding: "4px 12px", borderRadius: 20 }}>
          AI-powered recruiting intelligence
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 700, lineHeight: 1.15, maxWidth: 700, marginBottom: 20, color: "var(--text1)" }}>
          An intelligence layer on top of your ATS — not a replacement
        </h1>
        <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 520, lineHeight: 1.6, marginBottom: 36 }}>
          Hirefly ranks candidates using structured rubrics, surfaces evidence from every resume, and re-ranks in real time as your criteria evolve. Works alongside Greenhouse, Lever, and Ashby.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: 16, padding: "12px 28px", borderRadius: 8 }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              Get started {hovered ? "↗" : "→"}
            </button>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <button className="btn" style={{ fontSize: 16, padding: "12px 28px", borderRadius: 8 }}>
              Sign in
            </button>
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--text3)" }}>Free to try · Skip login to view demo</p>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 800, width: "100%", marginTop: 64 }}>
          {[
            { icon: "⚡", title: "Live re-ranking", desc: "Edit rubric weights and watch candidates reorder in under 2 seconds." },
            { icon: "📎", title: "Evidence-grounded", desc: "Every score links to a specific passage in the candidate's resume." },
            { icon: "🔌", title: "ATS-compatible", desc: "Import from Greenhouse, Lever, or Ashby CSV exports. No migration." },
            { icon: "🤖", title: "LLM-powered", desc: "Structured JSON scoring — not just keyword matching." },
          ].map(f => (
            <div key={f.title} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, textAlign: "left" }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ padding: "20px 32px", borderTop: "1px solid var(--border)", textAlign: "center", fontSize: 12, color: "var(--text3)" }}>
        Hirefly · Built for Google Recruiting Hackathon 2025
      </footer>
    </main>
  );
}
