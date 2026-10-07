"use client";
import ApiPanel from "./ApiPanel";
import RecordForm from "./RecordForm";
import { prescriptionApi } from "../lib/services";
export default function OcrEditor({ id }) {
  return <ApiPanel title="Prescription text" description="Enter text from the prescription. Automatic OCR is not available yet." endpoint={`/api/ocr/${id}`} allowMissing>
    {({ data, refresh, busy }) => !busy && <section className="panel"><h2>{data?.ocrResult ? "Edit text record" : "Create text record"}</h2>
      <RecordForm key={JSON.stringify(data?.ocrResult || {})} initial={data?.ocrResult || { status: "COMPLETED" }} fields={[
        { name: "extractedText", label: "Extracted text", type: "textarea", required: true },
        { name: "language", label: "Language code", nullable: true },
        { name: "confidence", label: "Confidence (optional)", type: "number", min: 0, max: 1, step: "any", nullable: true },
        { name: "status", label: "Status", required: true },
      ]} onSubmit={async (values) => { if (data?.ocrResult) await prescriptionApi.updateOcr(id, values); else await prescriptionApi.saveOcr(id, values); await refresh(); }} />
    </section>}
  </ApiPanel>;
}
