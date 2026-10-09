"use client";
import Link from "next/link";
import ApiPanel from "../../components/ApiPanel";
import { useLanguage } from "../../lib/i18n";
export default function Doctor() {
  const { t } = useLanguage();
  return <ApiPanel title="Doctor dashboard" description="Review patients who have granted your doctor account access." endpoint="/api/doctor/dashboard">
    {({data}) => data && <>
      <div className="toolbar">{[["prescriptions","Prescriptions"],["alerts","Alerts"],["recommendations","Recommendations"]].map(([path,label]) => <Link className="button secondary" key={path} href={"/doctor/"+path}>{t(label)}</Link>)}</div>
      <div className="stat-grid">{[["users","Patients"],["prescriptions","Prescriptions"],["medicines","Medicines"],["unreadAlerts","Unread alerts"],["pendingRecommendations","Recommendations"]].map(([key,label]) => <div className="stat" key={key}><span>{t(label)}</span><b>{data[key]}</b></div>)}</div>
      <section className="panel"><h2>{t("Patient")}</h2>{data.patients.map((patient) => <article className="patient-summary" key={patient.id}>
        <h3>{patient.name} · {patient.email}</h3>
        {patient.prescriptions.map((prescription) => <div className="row-card" key={prescription.id}><Link href={"/doctor/prescriptions/"+prescription.id}>{prescription.fileName}</Link>
          <span>{t("OCR confidence")}: {prescription.ocrResult?.confidence == null ? "—" : Math.round(prescription.ocrResult.confidence*100)+"%"} · {prescription.ocrResult?.status || "—"}</span></div>)}
      </article>)}</section>
    </>}
  </ApiPanel>;
}
