"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, PlusCircle, Upload, Settings, LogOut } from "lucide-react";

const NAV = [
  { key: "roles",  Icon: Briefcase,   href: "/dashboard",        label: "Open Roles" },
  { key: "new",    Icon: PlusCircle,  href: "/dashboard/new",    label: "Create Role" },
  { key: "import", Icon: Upload,      href: "/dashboard/import", label: "Import Resumes" },
];

function NavBtn({ isActive, children, onClick, title }: { isActive?: boolean; children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isActive ? "rgba(74,222,128,0.15)" : "transparent",
        color: isActive ? "#4ade80" : "rgba(255,255,255,0.38)",
        cursor: "pointer", transition: "background 0.15s, color 0.15s",
        outline: isActive ? "1px solid rgba(74,222,128,0.3)" : "none",
      }}
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.13)";
          (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.9)";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
          (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.38)";
        }
      }}
    >
      {children}
    </div>
  );
}

export default function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "DM";
  const displayName = userEmail ?? "Demo User";

  async function handleLogout() {
    await supabase.auth.signOut();
    document.cookie = "demo_mode=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <aside
      className="sidebar"
      style={{ justifyContent: "space-between", paddingTop: 20, paddingBottom: 20 }}
    >
      {/* Top — logo */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }} title="Hirefly">
          <img
            src="/hirefly-logo.svg"
            alt="Hirefly"
            style={{ width: 44, height: 44, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}
          />
        </Link>
      </div>

      {/* Middle — nav items evenly spaced */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-evenly",
          flex: 1,
          padding: "24px 0",
        }}
      >
        {NAV.map(({ key, Icon, href, label }) => (
          <Link key={key} href={href} title={label} style={{ textDecoration: "none" }}>
            <NavBtn isActive={active === key}>
              <Icon size={26} strokeWidth={active === key ? 2.2 : 1.8} />
            </NavBtn>
          </Link>
        ))}
      </nav>

      {/* Bottom — settings + avatar + logout */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <NavBtn onClick={() => alert("Preferences — coming soon")}>
          <Settings size={26} strokeWidth={1.8} />
        </NavBtn>

        {/* Avatar — shows real user initials, hover reveals tooltip with email */}
        <div
          title={displayName}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0d9488, #4ade80)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#0f2922",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          {initials}
        </div>

        {/* Logout button — icon style matching the nav */}
        <NavBtn onClick={handleLogout} title="Log out">
          <LogOut size={26} strokeWidth={1.8} />
        </NavBtn>
      </div>
    </aside>
  );
}