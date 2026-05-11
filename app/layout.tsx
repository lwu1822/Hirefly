import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hirefly — AI Recruiting Intelligence",
  description: "Rank candidates with AI, edit rubrics live, hire smarter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
