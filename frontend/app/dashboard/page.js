"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import Workspace from "../../components/Workspace";
import PrescriptionCard from "../../components/PrescriptionCard";
import ErrorMessage from "../../components/ErrorMessage";
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [health, setHealth] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(["/api/users/me", "/api/prescriptions", "/api/alerts", "/api/safety-reports"].map((path) => api(path, { signal: controller.signal }))).then(([profile, prescriptions, alerts, reports]) => setData({ user: profile.user, prescriptions: prescriptions.prescriptions, alerts: alerts.alerts, reports: reports.reports })).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    api("/api-health", { baseURL: "", signal: controller.signal }).then(() => setHealth("Service connected")).catch(() => { if (!controller.signal.aborted) setHealth("Service unavailable"); });
    return () => controller.abort();
  }, []);
  return <Workspace title={data ? "Good to see you, " + data.user.name : "Your dashboard"} description="Your medication safety overview.">
    <ErrorMessage message={error} />{!data && !error && <p className="feedback" role="status">Loading your records…</p>}
    {error && <button className="button secondary" onClick={() => window.location.reload()}>Retry</button>}
    {data && <><div className="stat-grid">{[["Prescriptions", data.prescriptions.length], ["Alerts", data.alerts.length], ["Unread alerts", data.alerts.filter((item) => !item.isRead).length], ["Reports", data.reports.length]].map(([label, value]) => <div className="stat" key={label}><span>{label}</span><b>{value}</b></div>)}</div>
      <section className="panel"><h2>Continue with a safety check</h2><div className="toolbar"><Link className="button" href="/prescriptions/upload">Add prescription</Link><Link className="button secondary" href="/interactions/drug-drug">Check medicines</Link><Link className="button secondary" href="/interactions/drug-food">Check food interactions</Link></div></section>
      <section className="panel"><h2>Recent prescriptions</h2><div className="list">{data.prescriptions.slice(0, 5).map((item) => <PrescriptionCard key={item.id} prescription={item} />)}</div>{!data.prescriptions.length && <p className="empty-state">Add a prescription to get started.</p>}</section>
      <section className="panel"><h2>Recent alerts</h2>{data.alerts.slice(0, 4).map((alert) => <article className="row-card" key={alert.id}><div><b>{alert.title}</b><p>{alert.message}</p></div><span className={"badge " + alert.severity.toLowerCase()}>{alert.severity}</span></article>)}{!data.alerts.length && <p className="empty-state">No alerts recorded.</p>}</section>
    </>}<p className="fine-print">{health}</p>
  </Workspace>;
}
