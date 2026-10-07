"use client";
import Link from "next/link";
import ApiPanel from "../../components/ApiPanel";
export default function Reports() {
  return <ApiPanel title="Safety reports" description="Reports generated from your prescription records and stored alerts." endpoint="/api/safety-reports">
    {({ data, busy }) => <div className="list">{(data?.reports || []).map((report) => <Link className="row-card" key={report.id} href={`/prescriptions/${report.prescriptionId}/report`}><div><b>Prescription #{report.prescriptionId}</b><p>{report.summary}</p></div><span className="badge">{report.overallStatus.replaceAll("_", " ")}</span></Link>)}{!busy && !data?.reports?.length && <p className="empty-state">No reports yet. Open a prescription to run analysis or generate a report.</p>}</div>}
  </ApiPanel>;
}
