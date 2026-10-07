"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../components/ApiPanel";
function Content() {
  const { id } = useParams();
  return (
    <ApiPanel
      title={`Prescription #${id}`}
      description="Prescription record, medicines, OCR, alerts and reports returned by the backend."
      endpoint={`/api/prescriptions/${id}`}
      actions={[
        {
          label: "Run full analysis",
          path: `/api/analyze/${id}`,
          success: "Analysis completed.",
        },
        {
          label: "Generate safety report",
          path: `/api/safety-reports/generate/${id}`,
          success: "Safety report generated.",
        },
      ]}
    >
      {({ data }) => {
        const p = data?.prescription;
        if (!p)
          return (
            <p className="empty-state">Prescription details unavailable.</p>
          );
        return (
          <>
            <div className="stat-grid">
              <div className="stat">
                <span>File</span>
                <b className="small-stat">{p.fileName}</b>
              </div>
              <div className="stat">
                <span>Medicines</span>
                <b>{p.medicines?.length || 0}</b>
              </div>
              <div className="stat">
                <span>Alerts</span>
                <b>{p.alerts?.length || 0}</b>
              </div>
              <div className="stat">
                <span>OCR status</span>
                <b className="small-stat">{p.ocrResult?.status || "—"}</b>
              </div>
            </div>
            <div className="toolbar">
              <Link
                className="button secondary"
                href={`/prescriptions/${id}/ocr`}
              >
                OCR
              </Link>
              <Link
                className="button secondary"
                href={`/prescriptions/${id}/medicines`}
              >
                Medicines
              </Link>
              <Link
                className="button secondary"
                href={`/prescriptions/${id}/analysis`}
              >
                Analysis
              </Link>
              <Link
                className="button secondary"
                href={`/prescriptions/${id}/report`}
              >
                Safety report
              </Link>
            </div>
            <section className="panel">
              <h2>Prescription text</h2>
              <p>{p.ocrText || "No text has been recorded yet."}</p>
            </section>
            <section className="panel">
              <h2>Detected medicines</h2>
              {(p.medicines || []).length ? (
                <div className="list">
                  {p.medicines.map((x, i) => (
                    <div className="row-card" key={x.id || i}>
                      <b>{x.medicine?.name || "Medicine"}</b>
                      <span>
                        {x.dosage || ""} {x.frequency || ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">
                  No medicines linked to this prescription.
                </p>
              )}
            </section>
          </>
        );
      }}
    </ApiPanel>
  );
}
export default function PrescriptionDetail() {
  return (
    <Suspense fallback={<p>Loading prescription…</p>}>
      <Content />
    </Suspense>
  );
}
