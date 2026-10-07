"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/dashboard"],
  ["Prescriptions", "/prescriptions"],
  ["Drug interactions", "/interactions/drug-drug"],
  ["Food interactions", "/interactions/drug-food"],
  ["Alerts", "/alerts"],
  ["Languages", "/languages"],
  ["Knowledge graph", "/knowledge-graph"],
  ["Doctor tools", "/doctor"],
  ["Profile", "/profile"],
];

export default function Workspace({ title, description, children }) {
  const path = usePathname();
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">M</span>
          <span>
            MediSafe<small>Medication safety</small>
          </span>
        </Link>
        <nav className="side-nav">
          {links.map(([name, href]) => (
            <Link
              className={path === href ? "active" : ""}
              href={href}
              key={href}
            >
              {name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <b>Care, with clarity.</b>
          <p>Review safety information with your healthcare professional.</p>
        </div>
      </aside>
      <section className="workspace-main">
        <header className="topbar">
          <span>Patient safety workspace</span>
          <Link href="/profile">My account　↗</Link>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">MEDISAFE / WORKSPACE</p>
              <h1>{title}</h1>
              {description && <p className="subheading">{description}</p>}
            </div>
          </div>
          {children}
        </main>
      </section>
    </div>
  );
}
