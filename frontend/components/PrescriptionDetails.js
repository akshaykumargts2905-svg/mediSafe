"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApiPanel from "./ApiPanel";
import ClinicalResult, { Alternatives } from "./ClinicalResult";
import PrescriptionImage from "./PrescriptionImage";
import SpeakButton from "./SpeakButton";
import { patientText, useLanguage } from "../lib/i18n";
export default function PrescriptionDetails({ id, doctor = false }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  return <ApiPanel title={doctor ? "Prescription review" : "Prescriptions"} description="Review safety information with your healthcare professional." endpoint={doctor ? `/api/doctor/prescriptions/${id}` : `/api/prescriptions/${id}`}
    actions={doctor ? [] : [{ label: "Run full analysis", path: `/api/analyze/${id}`, success: "Analysis completed." }, { label: "Generate safety report", path: `/api/safety-reports/generate/${id}`, success: "Report generated." }]}>
    {({ data, run, busy }) => {
      const prescription = data?.prescription;
      if (!prescription) return null;
      const alternatives = prescription.medicines.flatMap((row) => (row.medicine.alternatives || []).map((alternative) => ({...alternative,medicine:row.medicine})));
      return <>
        <h2>{prescription.fileName}</h2>
        {doctor && <p>{t("Patient")}: {prescription.user?.name} · {prescription.user?.email}</p>}
        <div className="stat-grid">{[["Medicines",prescription.medicines.length],["Alerts",prescription.alerts.length],["OCR confidence",prescription.ocrResult?.confidence == null ? "—" : Math.round(prescription.ocrResult.confidence * 100)+"%"],["Status",prescription.ocrResult?.status || "—"]].map(([label,value]) => <div className="stat" key={label}><span>{t(label)}</span><b className="small-stat">{value}</b></div>)}</div>
        <div className="toolbar">{!doctor && [["ocr","Prescription text"],["medicines","Manage medicines"],["analysis","Run analysis"],["report","Safety report"]].map(([path,label]) => <Link className="button secondary" key={path} href={`/prescriptions/${id}/${path}`}>{t(label)}</Link>)}{doctor && <Link className="button secondary" href="/doctor/recommendations">{t("Recommendations")}</Link>}</div>
        {prescription.ocrResult?.inputMethod === "IMAGE" && <PrescriptionImage id={id} />}
        <section className="panel"><h2>{t("Prescription text")}</h2><p className="preserve-lines">{prescription.ocrText || t("No record yet.")}</p>
          {(prescription.ocrResult?.candidates?.matches || []).map((match) => <p key={match.medicineId}>{match.name} ? RxCUI {match.rxCui || "—"} · {Math.round(match.confidence * 100)}%</p>)}
          {prescription.fileUrl && /^https?:\/\//i.test(prescription.fileUrl) && <a className="button secondary" href={prescription.fileUrl} target="_blank" rel="noopener noreferrer">Open linked file</a>}
        </section>
        <section className="panel"><h2>{t("Medicines")}</h2>{prescription.medicines.length ? prescription.medicines.map((row) => <article className="row-card" key={row.id}><Link href={"/medicines/" + row.medicineId}><b>{row.medicine.name}</b><small>RxCUI {row.medicine.rxCui || "—"}</small></Link><span>{[row.dosage,row.frequency,row.duration].filter(Boolean).join(" · ")}</span></article>) : <p className="empty-state">{t("No record yet.")}</p>}</section>
        {prescription.alerts.map((alert) => <ClinicalResult key={alert.id} record={alert} />)}
        <Alternatives rows={alternatives} />
        {prescription.recommendations.length > 0 && <section className="panel"><h2>{t("Recommendations")}</h2>{prescription.recommendations.map((row) => <article key={row.id}><h3>{row.medicine?.name}</h3><p>{patientText(row,"reason",language)}</p><p>{patientText(row,"alternative",language)}</p><span className="badge">{row.status}</span><SpeakButton key={language} text={[row.medicine?.name,patientText(row,"reason",language),patientText(row,"alternative",language)].filter(Boolean).join(". ")} /></article>)}</section>}
        {!doctor && <button className="button danger" disabled={busy} onClick={async () => { if (confirm("Delete this prescription and its text, alerts, reports and recommendations?")) { const result = await run({path:`/api/prescriptions/${id}`,method:"DELETE",refresh:false}); if (result) router.push("/prescriptions"); } }}>Delete prescription</button>}
      </>;
    }}
  </ApiPanel>;
}
