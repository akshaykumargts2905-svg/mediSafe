"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import Workspace from "../../components/Workspace";
import PrescriptionCard from "../../components/PrescriptionCard";
import ErrorMessage from "../../components/ErrorMessage";
import ClinicalResult from "../../components/ClinicalResult";
import { useLanguage } from "../../lib/i18n";
import Icon from "../../components/Icon";
export default function Dashboard() {
  const { language, t } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [health, setHealth] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["/api/users/me", "/api/prescriptions", "/api/alerts", "/api/safety-reports"].map((path) => api(path, { signal: controller.signal }))).then(([profile, prescriptions, alerts, reports]) => setData({ user: profile.user, prescriptions: prescriptions.prescriptions, alerts: alerts.alerts, reports: reports.reports })).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    api("/api-health", { baseURL: "", signal: controller.signal }).then(() => setHealth("Service connected")).catch(() => { if (!controller.signal.aborted) setHealth("Service unavailable"); });
    return () => controller.abort();
  }, [language]);
  return <Workspace title={data ? t("Your dashboard") + " · " + data.user.name : "Your dashboard"} description="Your medication safety overview.">
    <ErrorMessage message={error} />{!data && !error && <p className="feedback" role="status">Loading your records…</p>}
    {error && <button className="button secondary" onClick={() => window.location.reload()}>{t("Retry")}</button>}
    {data && <>
      <section className="dashboard-welcome"><div><span className="welcome-label"><Icon name="shield" size={17} /> {t("Care, with clarity.")}</span><h2>{t("Continue with a safety check")}</h2><p>{t("Review safety information with your healthcare professional.")}</p><Link className="button" href="/prescriptions/upload"><Icon name="plus" size={18} />{t("Add prescription")}</Link></div><div className="welcome-art" aria-hidden="true"><div className="welcome-art-ring"><Icon name="shield" size={62} /></div><span className="welcome-art-pill"><Icon name="pill" size={24} /></span><span className="welcome-art-heart"><Icon name="heart" size={21} /></span></div></section>
      <div className="stat-grid dashboard-stats">{[["Prescriptions", data.prescriptions.length, "prescription", "/prescriptions"], ["Alerts", data.alerts.length, "bell", "/alerts"], ["Unread alerts", data.alerts.filter((item) => !item.isRead).length, "shield", "/alerts"], ["Reports", data.reports.length, "report", "/reports"]].map(([label, value, icon, href], index) => <Link className={`stat stat-${index}`} href={href} key={label}><div className="stat-top"><span className="icon-tile"><Icon name={icon} size={21} /></span><Icon name="arrow" size={17} /></div><b>{value}</b><span>{t(label)}</span></Link>)}</div>
      <div className="quick-checks"><Link href="/interactions/drug-drug"><span className="icon-tile"><Icon name="pill" size={22} /></span><span>{t("Check medicines")}<small>{t("Drug–drug check")}</small></span><Icon name="arrow" size={19} /></Link><Link href="/interactions/drug-food"><span className="icon-tile"><Icon name="leaf" size={22} /></span><span>{t("Check food interactions")}<small>{t("Drug–food check")}</small></span><Icon name="arrow" size={19} /></Link></div>
      <div className="dashboard-columns"><section className="panel dashboard-panel"><div className="panel-heading"><h2>{t("Recent prescriptions")}</h2><Link className="icon-button" href="/prescriptions" aria-label={t("Prescriptions")}><Icon name="arrow" size={18} /></Link></div><div className="list">{data.prescriptions.slice(0, 5).map((item) => <PrescriptionCard key={item.id} prescription={item} />)}</div>{!data.prescriptions.length && <div className="dashboard-empty"><span className="icon-tile"><Icon name="prescription" size={26} /></span><p>Add a prescription to get started.</p><Link className="text-link" href="/prescriptions/upload">{t("Add prescription")}<Icon name="arrow" size={16} /></Link></div>}</section>
      <section className="panel dashboard-panel"><div className="panel-heading"><h2>{t("Recent alerts")}</h2><Link className="icon-button" href="/alerts" aria-label={t("Alerts")}><Icon name="arrow" size={18} /></Link></div>{data.alerts.slice(0, 4).map((alert) => <ClinicalResult key={alert.id} record={alert} />)}{!data.alerts.length && <div className="dashboard-empty"><span className="icon-tile"><Icon name="bell" size={26} /></span><p>{t("No alerts recorded.")}</p></div>}</section></div>
    </>}<p className="fine-print service-status">{health && <><span className={`status-dot${health === "Service unavailable" ? " status-offline" : ""}`} />{health}</>}</p>
  </Workspace>;
}
