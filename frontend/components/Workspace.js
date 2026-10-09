"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearSession, getToken, subscribeSession } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import LanguageSelector from "./LanguageSelector";
import Brand from "./Brand";
import Icon from "./Icon";

const groups = [
  { label: "YOUR CARE", links: [["Dashboard", "/dashboard", "grid"], ["Prescriptions", "/prescriptions", "prescription"], ["Interaction checks", "/interactions", "interaction"], ["Alerts", "/alerts", "bell"], ["Safety reports", "/reports", "report"]] },
  { label: "EXPLORE & UNDERSTAND", links: [["Medicines", "/medicines", "pill"], ["Foods", "/foods", "leaf"], ["Interaction catalog", "/interactions/catalog", "book"], ["Knowledge graph", "/knowledge-graph", "network"], ["Languages", "/languages", "globe"]] },
  { label: "YOUR CONNECTIONS", links: [["Care team", "/care-team", "users"], ["Doctor tools", "/doctor", "doctor"], ["Profile", "/profile", "user"]] },
];
const links = groups.flatMap((group) => group.links);

export default function Workspace({ title, description, children }) {
  const { t } = useLanguage();
  const path = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const token = useSyncExternalStore(subscribeSession, getToken, () => null);
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [token, router]);
  const current = links.filter(([, href]) => path === href || path.startsWith(href + "/")).sort((a, b) => b[1].length - a[1].length)[0];
  if (!token) return <main className="session-loading"><Icon name="shield" size={34} /><p role="status">Checking your session…</p></main>;
  return <div className="workspace">
    <a className="skip-link" href="#workspace-content">Skip to content</a>
    <aside className={`sidebar${menuOpen ? " menu-open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("navigation-toggle")?.focus(); } }}>
      <div className="sidebar-brand"><Brand href="/dashboard" /><button id="navigation-toggle" className="icon-button mobile-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button></div>
      <nav id="workspace-navigation" className="side-nav" aria-label="Main navigation">{groups.map((group) => <div className="nav-group" key={group.label}><p className="nav-group-label">{group.label}</p>{group.links.map(([name, href, icon]) => <Link className={current?.[1] === href ? "active" : ""} aria-current={current?.[1] === href ? "page" : undefined} href={href} key={href} onClick={() => setMenuOpen(false)}><Icon name={icon} size={18} /><span>{t(name)}</span>{current?.[1] === href && <span className="nav-active-dot" aria-hidden="true" />}</Link>)}</div>)}</nav>
      <div className="sidebar-note"><span className="icon-tile"><Icon name="shield" size={22} /></span><b>{t("Care, with clarity.")}</b><p>{t("Review safety information with your healthcare professional.")}</p></div>
      <div className="sidebar-footer"><span className="status-dot" /> MEDISAFE · MADE FOR YOUR CARE</div>
    </aside>
    <section className="workspace-main">
      <header className="topbar"><div className="topbar-location"><Icon name={current?.[2] || "shield"} size={18} /><span>MediSafe</span><span className="breadcrumb-divider">/</span><b>{t(current?.[0] || "Patient safety workspace")}</b></div><div className="topbar-actions"><div className="topbar-language"><Icon name="globe" size={17} /><LanguageSelector /></div><Link className="account-link" href="/profile" aria-label={t("My account ↗")}><Icon name="user" size={18} /><span>{t("My account ↗")}</span></Link><button className="text-button logout-button" onClick={() => { window.speechSynthesis?.cancel(); clearSession(); window.location.replace("/login"); }}><Icon name="logout" size={17} /><span>{t("Log out")}</span></button></div></header>
      <main className="content" id="workspace-content"><div className="page-heading"><p className="eyebrow"><span className="eyebrow-line" /> MEDISAFE / WORKSPACE</p><h1>{t(title)}</h1>{description && <p className="subheading">{t(description)}</p>}</div>{children}<footer className="workspace-footer"><Icon name="shield" size={16} /><span>{t("Review safety information with your healthcare professional.")}</span><span className="workspace-footer-brand">MediSafe</span></footer></main>
    </section>
  </div>;
}
