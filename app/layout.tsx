import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premier League Form Book V1",
  description: "Weekly form book, verdicts, probabilities, and self-marking.",
};

const nav = [
  ["/", "Dashboard"],
  ["/fixtures", "Fixtures"],
  ["/results", "Results"],
  ["/model", "Model"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div>
              <div className="eyebrow">Premier League Form Book</div>
              <h1 className="brand">V1 starter repo</h1>
            </div>
            <nav className="nav">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className="navlink">
                  {label}
                </Link>
              ))}
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
