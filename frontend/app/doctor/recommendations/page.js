"use client";
import { useEffect, useState } from "react";
import Workspace from "../../../components/Workspace";
import RecordForm from "../../../components/RecordForm";
import ErrorMessage from "../../../components/ErrorMessage";
import { api } from "../../../lib/api";
import { doctorApi } from "../../../lib/services";
export default function Recommendations() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [id, setId] = useState("");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api("/api/doctor/prescriptions"), api("/api/medicines")]).then(([p, m]) => { if (active) { setPrescriptions(p.prescriptions); setMedicines(m.medicines); } }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function load(value) {
    setId(value); setRows([]); setEditing(null); setError("");
    if (!value) return;
    setBusy(true);
    try { setRows((await doctorApi.recommendations(value)).recommendations); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  const fields = [{ name: "reasonHi", label: "Reason (Hindi)", type: "textarea", nullable: true }, { name: "alternativeHi", label: "Alternative (Hindi)", nullable: true }, { name: "reason", label: "Reason", type: "textarea", required: true }, { name: "alternative", label: "Alternative", nullable: true }, { name: "status", label: "Status", required: true }];
  return <Workspace title="Doctor recommendations" description="Record guidance for patients who have granted your doctor account access.">
    <label>Prescription<select aria-label="Prescription" className="form-control" value={id} disabled={busy} onChange={(event) => load(event.target.value)}><option value="">Select a prescription</option>{prescriptions.map((item) => <option value={item.id} key={item.id}>{item.fileName}</option>)}</select></label>
    <ErrorMessage message={error} />{busy && <p className="feedback" role="status">Loading recommendations…</p>}
    {id && <section className="panel"><h2>{editing ? "Edit recommendation" : "Add recommendation"}</h2><RecordForm key={editing?.id || id} initial={editing || { status: "PENDING" }} fields={editing ? fields : [{ name: "medicineId", label: "Medicine", type: "number", required: true, options: medicines.map((item) => ({ value: item.id, label: item.name })) }, ...fields]} onCancel={editing ? () => setEditing(null) : undefined} onSubmit={async (values) => {
      if (editing) await doctorApi.updateRecommendation(editing.id, values);
      else await doctorApi.createRecommendation({ ...values, prescriptionId: Number(id) });
      setEditing(null); await load(id);
    }} /></section>}
    {rows.map((row) => <article className="row-card" key={row.id}><div><b>{row.medicine?.name}</b><p>{row.reason}</p>{row.alternative && <p>Alternative: {row.alternative}</p>}<span className="badge">{row.status}</span></div><button className="button secondary" onClick={() => setEditing(row)}>Edit recommendation</button></article>)}
    {!busy && !rows.length && <p className="empty-state">{id ? "No recommendations for this prescription." : "Choose a prescription to review its recommendations."}</p>}
  </Workspace>;
}
