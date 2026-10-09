"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ApiPanel from "./ApiPanel";
import RecordForm from "./RecordForm";
import ErrorMessage from "./ErrorMessage";
import PrescriptionImage from "./PrescriptionImage";
import { api, json } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { prescriptionApi } from "../lib/services";

function Review({ id, record, refresh }) {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.all([api("/api/medicines"), prescriptionApi.medicines(id)]).then(([data, links]) => {
      if (active) {
        setCatalog(data.medicines);
        setSelected(links.medicines.map((row) => row.medicineId));
      }
    }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const candidates = record.candidates?.matches || [];
  const byId = new Map(candidates.map((row) => [row.medicineId, row]));
  const ordered = [...catalog].sort((a, b) => Number(byId.has(b.id)) - Number(byId.has(a.id)));
  return <section className="panel"><h2>{t("Review detected medicines")}</h2>
    <p>{t("OCR confidence")}: {record.confidence == null ? "—" : Math.round(record.confidence * 100) + "%"}</p>
    {record.confidence != null && record.confidence < .8 && <p className="feedback" role="status">{t("Low confidence. Check the original image and correct the text before confirming.")}</p>}
    <p>{t("Select the medicines actually present on your prescription. Nothing is added automatically.")}</p>
    {!candidates.length && <p>{t("No catalog matches found. Correct the text or select medicines below.")}</p>}
    {loading && <p role="status">{t("Loading medicine catalog?")}</p>}
    <form onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setError("");
      try { await api("/api/ocr/" + id + "/confirm", json("POST", { medicineIds: selected, reviewVersion: record.reviewVersion })); await refresh(); }
      catch (failure) { setError(failure.message); } finally { setBusy(false); }
    }}>
      <fieldset disabled={busy || loading} className="medicine-review">
        {ordered.map((medicine) => {
          const match = byId.get(medicine.id);
          return <label className="review-option" key={medicine.id}>
            <input type="checkbox" checked={selected.includes(medicine.id)} onChange={(event) => setSelected((ids) => event.target.checked ? [...ids, medicine.id] : ids.filter((value) => value !== medicine.id))} />
            <span><b>{medicine.name}</b>{medicine.rxCui && <small>RxCUI {medicine.rxCui}</small>}
              {match && <small>{t(match.matchType)} · {Math.round(match.confidence * 100)}% ? {match.matchedText}{match.detectedStrength ? " · " + match.detectedStrength : ""}</small>}
            </span>
          </label>;
        })}
        <button className="button" disabled={!selected.length}>{t(busy ? "Confirming…" : "Confirm medicines")}</button>
      </fieldset>
    </form><ErrorMessage message={error} />
    {record.status === "CONFIRMED" && <p className="feedback success" role="status">{t("Medicines confirmed. You can now run analysis.")} <Link href={"/prescriptions/" + id + "/analysis"}>{t("Run analysis")} →</Link></p>}
    {!!record.candidates?.unmatchedLines?.length && <details><summary>{t("Unmatched text")}</summary><p className="preserve-lines">{record.candidates.unmatchedLines.join("\n")}</p></details>}
  </section>;
}
export default function OcrEditor({ id }) {
  const { language, t } = useLanguage();
  return <ApiPanel title="Prescription text" description="Review detected medicines" endpoint={`/api/ocr/${id}`} allowMissing>
    {({ data, refresh, busy }) => !busy && <>
      {data?.ocrResult?.inputMethod === "IMAGE" && <PrescriptionImage id={id} />}
      <section className="panel"><h2>{t("Extracted text")}</h2>
        <RecordForm key={JSON.stringify(data?.ocrResult || {})} initial={data?.ocrResult || { language }} submitLabel="Save corrected text" fields={[
          { name: "extractedText", label: "Extracted text", type: "textarea", required: true },
          { name: "language", label: "OCR language", required: true, options: [{value:"en",label:"English"}, {value:"hi",label:"Hindi"}] },
        ]} onSubmit={async (values) => {
          if (data?.ocrResult) await prescriptionApi.updateOcr(id, values); else await prescriptionApi.saveOcr(id, values);
          await refresh();
        }} />
      </section>
      {data?.ocrResult && <Review key={data.ocrResult.reviewVersion + ":" + data.ocrResult.status} id={id} record={data.ocrResult} refresh={refresh} />}
    </>}
  </ApiPanel>;
}
