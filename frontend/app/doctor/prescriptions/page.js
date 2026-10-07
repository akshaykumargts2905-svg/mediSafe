"use client";
import Link from "next/link";
import ApiPanel from "../../../components/ApiPanel";
export default function DoctorPrescriptions() {
  return (
    <ApiPanel
      title="Patient prescriptions"
      description="Open a record to review patient and prescription details."
      endpoint="/api/doctor/prescriptions"
    >
      {({ data }) => {
        const rows = data?.prescriptions || [];
        return rows.length ? (
          <div className="list">
            {rows.map((p) => (
              <Link
                className="row-card"
                href={`/doctor/prescriptions/${p.id}`}
                key={p.id}
              >
                <span>
                  <b>{p.fileName || `Prescription #${p.id}`}</b>
                  <p>
                    {p.user?.name || "Patient"} · {p.medicines?.length || 0}{" "}
                    linked medicines
                  </p>
                </span>
                <span className="badge">{p.status || "REVIEW"}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-state">No prescriptions returned.</p>
        );
      }}
    </ApiPanel>
  );
}
