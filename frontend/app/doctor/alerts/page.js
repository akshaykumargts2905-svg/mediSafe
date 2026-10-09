"use client";
import Link from "next/link";
import ApiPanel from "../../../components/ApiPanel";
import ClinicalResult from "../../../components/ClinicalResult";
export default function DoctorAlerts() {
  return <ApiPanel title="Prescription safety alerts" description="Alerts for patients who have granted you access." endpoint="/api/doctor/alerts">
    {({data,busy}) => <>{(data?.alerts || []).map((alert) => <div key={alert.id}><Link href={"/doctor/prescriptions/"+alert.prescriptionId}>{alert.prescription?.fileName || "Prescription #"+alert.prescriptionId}</Link><ClinicalResult record={alert} /></div>)}{!busy && !data?.alerts?.length && <p className="empty-state">No alerts returned.</p>}</>}
  </ApiPanel>;
}
