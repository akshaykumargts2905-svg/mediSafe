"use client";
import { useEffect, useState } from "react";
import ApiPanel from "../../components/ApiPanel";
import RecordForm from "../../components/RecordForm";
import ErrorMessage from "../../components/ErrorMessage";
import { api, json } from "../../lib/api";
import ClinicalResult from "../../components/ClinicalResult";
import { patientText, useLanguage } from "../../lib/i18n";
import { severityOptions } from "../../lib/catalog";
export default function Alerts() {
  const { language, t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/api/prescriptions").then((data) => { if (active) setPrescriptions(data.prescriptions); }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  return <ApiPanel key={filter} title="Safety alerts" description="Review alerts and add notes for your own prescriptions." endpoint={"/api/alerts" + (filter ? "?prescriptionId=" + filter : "")}>
    {({ data, refresh, run, busy }) => <>
      <label>Filter by prescription<select className="form-control" value={filter} onChange={(event) => { setFilter(event.target.value); setDetail(null); }}><option value="">All prescriptions</option>{prescriptions.map((prescription) => <option key={prescription.id} value={prescription.id}>{prescription.fileName}</option>)}</select></label>
      <ErrorMessage message={error} />
      <details className="panel"><summary>Add an alert</summary><RecordForm fields={[
        { name: "prescriptionId", label: "Prescription", type: "number", required: true, options: prescriptions.map((item) => ({ value: item.id, label: item.fileName })) },
        { name: "type", label: "Type", required: true }, { name: "severity", label: "Severity", required: true, options: severityOptions },
        { name: "title", label: "Title", required: true }, { name: "message", label: "Message", type: "textarea", required: true },
        { name: "language", label: "Language code" }, { name: "isRead", label: "Already read", type: "checkbox" },
      ]} initial={{ type: "MANUAL", severity: "LOW", language: "en" }} onSubmit={async (values) => { await api("/api/alerts", json("POST", values)); await refresh(); }} /></details>
      {detail && <section className="panel"><ClinicalResult record={detail} /><p>Prescription #{detail.prescriptionId} · {detail.language} · {detail.isRead ? "Read" : "Unread"}</p><button className="text-button" onClick={() => setDetail(null)}>{t("Close details")}</button></section>}
      <div className="list">{(data?.alerts || []).map((alert) => <article className="row-card" key={alert.id}><div><b>{alert.title}</b><p>{patientText(alert, "message", language)}</p><span className={"badge " + alert.severity.toLowerCase()}>{t(alert.severity)}</span><span> · {t(alert.isRead ? "Read" : "Unread")}</span></div>
        <div className="toolbar"><button className="button secondary" disabled={busy} onClick={async () => { setError(""); try { setDetail((await api("/api/alerts/" + alert.id)).alert); } catch (failure) { setError(failure.message); } }}>{t("Details")}</button>
          <button className="button secondary" disabled={busy || alert.isRead} onClick={() => run({ path: `/api/alerts/${alert.id}/read`, method: "PATCH", success: "Alert marked read." })}>{t("Mark read")}</button>
          <button className="button danger" disabled={busy} onClick={async () => { if (confirm("Delete this alert?")) { const result = await run({ path: "/api/alerts/" + alert.id, method: "DELETE" }); if (result) setDetail(null); } }}>{t("Delete")}</button>
        </div></article>)}</div>
      {!busy && !data?.alerts?.length && <p className="empty-state">{t("No alerts for this view.")}</p>}
    </>}
  </ApiPanel>;
}
