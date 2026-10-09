"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { clearSession, getToken, subscribeSession } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import LanguageSelector from "./LanguageSelector";

const links = [
  ["Dashboard", "/dashboard"], ["Prescriptions", "/prescriptions"], ["Medicines", "/medicines"],
  ["Foods", "/foods"], ["Interaction checks", "/interactions"], ["Interaction catalog", "/interactions/catalog"],
  ["Alerts", "/alerts"], ["Safety reports", "/reports"], ["Languages", "/languages"],
  ["Knowledge graph", "/knowledge-graph"], ["Doctor tools", "/doctor"], ["Profile", "/profile"],
  ["Care team", "/care-team"],
];
export default function Workspace({ title, description, children }) {
  const { t } = useLanguage();
  const path = usePathname();
  const router = useRouter();
  const token = useSyncExternalStore(subscribeSession, getToken, () => null);
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [token, router]);
  if (!token) return <main className="auth-wrap"><p role="status">Checking your session…</p></main>;
  return <div className="workspace"><aside className="sidebar">
    <Link className="brand" href="/dashboard"><span className="brand-mark">M</span><span>MediSafe<small>Medication safety</small></span></Link>
    <nav className="side-nav" aria-label="Main navigation">{links.map(([name, href]) => <Link className={path === href ? "active" : ""} href={href} key={href}>{t(name)}</Link>)}</nav>
    <div className="sidebar-note"><b>{t("Care, with clarity.")}</b><p>{t("Review safety information with your healthcare professional.")}</p></div>
  </aside><section className="workspace-main"><header className="topbar"><span>{t("Patient safety workspace")}</span><div className="toolbar">
    <LanguageSelector /><Link href="/profile">{t("My account ↗")}</Link><button className="text-button" onClick={() => { window.speechSynthesis?.cancel(); clearSession(); window.location.replace("/login"); }}>{t("Log out")}</button>
  </div></header><main className="content"><div className="page-heading"><p className="eyebrow">MEDISAFE / WORKSPACE</p><h1>{t(title)}</h1>{description && <p className="subheading">{t(description)}</p>}</div>{children}</main></section></div>;
}
