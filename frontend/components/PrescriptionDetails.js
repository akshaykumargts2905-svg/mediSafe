"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ApiPanel from "./ApiPanel";
export default function PrescriptionDetails({ id, doctor = false }) {
  const router = useRouter();
  return <ApiPanel title={`Prescription #${id}`} description={doctor ? "Review your prescription and recorded guidance." : "Your prescription record, medicines and safety findings."} endpoint={doctor ? `/api/doctor/prescriptions/${id}` : `/api/prescriptions/${id}`}
    actions={[{ label: "Run full analysis", path: `/api/analyze/${id}`, success: "Analysis completed." }, { label: "Generate safety report", path: `/api/safety-reports/generate/${id}`, success: "Report generated." }]}>
    {({ data, run, busy }) => {
      const prescription = data?.prescription;
      if (!prescription) return null;
      return <>
        <div className="stat-grid"><div className="stat"><span>File</span><b className="small-stat">{prescription.fileName}</b></div><div className="stat"><span>Medicines</span><b>{prescription.medicines.length}</b></div><div className="stat"><span>Alerts</span><b>{prescription.alerts.length}</b></div><div className="stat"><span>Text status</span><b className="small-stat">{prescription.ocrResult?.status || "Not recorded"}</b></div></div>
        <div className="toolbar">{[["ocr", "Prescription text"], ["medicines", "Manage medicines"], ["analysis", "Analysis"], ["report", "Safety report"]].map(([path, label]) => <Link className="button secondary" key={path} href={`/prescriptions/${id}/${path}`}>{label}</Link>)}<Link className="button secondary" href="/doctor/recommendations">Recommendations</Link></div>
        <section className="panel"><h2>Prescription text</h2><p className="preserve-lines">{prescription.ocrText || "No text recorded."}</p>
          {prescription.fileUrl && /^https?:\/\//i.test(prescription.fileUrl) && <a className="button secondary" href={prescription.fileUrl} target="_blank" rel="noopener noreferrer">Open linked file</a>}
        </section>
        <section className="panel"><h2>Linked medicines</h2>{prescription.medicines.length ? prescription.medicines.map((row) => <article className="row-card" key={row.id}><Link href={"/medicines/" + row.medicineId}><b>{row.medicine.name}</b></Link><span>{[row.dosage, row.frequency, row.duration].filter(Boolean).join(" · ")}</span></article>) : <p className="empty-state">No medicines linked yet.</p>}</section>
        {prescription.recommendations.length > 0 && <section className="panel"><h2>Recommendations</h2>{prescription.recommendations.map((row) => <article key={row.id}><h3>{row.medicine?.name}</h3><p>{row.reason}</p><p>{row.alternative}</p><span className="badge">{row.status}</span></article>)}</section>}
        <button className="button danger" disabled={busy} onClick={async () => { if (confirm("Delete this prescription and its text, alerts, reports and recommendations?")) { const result = await run({ path: `/api/prescriptions/${id}`, method: "DELETE", refresh: false }); if (result) router.push("/prescriptions"); } }}>Delete prescription</button>
      </>;
    }}
  </ApiPanel>;
}
