"use client";
import { useEffect, useState } from "react";
import ApiPanel from "./ApiPanel";
import RecordForm from "./RecordForm";
import ErrorMessage from "./ErrorMessage";
import { api } from "../lib/api";
import { prescriptionApi } from "../lib/services";
const details = ["dosage", "frequency", "duration"].map((name) => ({ name, label: name[0].toUpperCase() + name.slice(1), nullable: true }));
export default function PrescriptionMedicines({ id }) {
  const [medicines, setMedicines] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/api/medicines").then((data) => { if (active) setMedicines(data.medicines); }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  return <ApiPanel title="Prescription medicines" description="Link medicines and record the instructions on your prescription." endpoint={`/api/prescriptions/${id}/medicines`}>
    {({ data, refresh, run, busy }) => <>
      <ErrorMessage message={error} />
      <section className="panel"><h2>{editing ? "Edit instructions" : "Link a medicine"}</h2>
        <RecordForm key={editing?.id || "new"} initial={editing || {}} fields={editing ? details : [{ name: "medicineId", label: "Medicine", type: "number", required: true, options: medicines.filter((medicine) => !(data?.medicines || []).some((row) => row.medicineId === medicine.id)).map((medicine) => ({ value: medicine.id, label: medicine.name })) }, ...details]}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSubmit={async (values) => { if (editing) await prescriptionApi.updateMedicine(id, editing.medicineId, values); else await prescriptionApi.addMedicine(id, values); setEditing(null); await refresh(); }} />
      </section>
      <div className="list">{(data?.medicines || []).map((row) => <article className="row-card" key={row.id}><div><b>{row.medicine.name}</b><p>{[row.dosage, row.frequency, row.duration].filter(Boolean).join(" · ") || "No instructions recorded"}</p></div><div className="toolbar"><button className="button secondary" onClick={() => setEditing(row)}>Edit</button><button className="button danger" disabled={busy} onClick={() => { if (confirm("Remove this medicine from the prescription?")) run({ path: `/api/prescriptions/${id}/medicines/${row.medicineId}`, method: "DELETE", success: "Medicine unlinked." }); }}>Remove</button></div></article>)}</div>
      {!busy && !data?.medicines?.length && <p className="empty-state">No medicines linked yet.</p>}
    </>}
  </ApiPanel>;
}
