"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RecordForm from "./RecordForm";
import ErrorMessage from "./ErrorMessage";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import { prescriptionApi } from "../lib/services";

export default function UploadPrescription() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [savedId, setSavedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("image");
    if (!file?.size || file.size > 5 * 1024 * 1024) { setError("Choose an image up to 5 MB."); return; }
    setBusy(true); setError("");
    try {
      const data = await api("/api/prescriptions/upload", { method: "POST", data: form, timeout: 120000 });
      router.push("/prescriptions/" + data.prescription.id + "/ocr");
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return <>
    <section className="panel"><h2>{t("Upload prescription image")}</h2>
      <p>{t("PNG, JPEG or WebP, up to 5 MB. Review every detected medicine before analysis.")}</p>
      <form className="record-form" onSubmit={upload}><fieldset disabled={busy}>
        <label>{t("Prescription image")}<input className="form-control" name="image" type="file" accept="image/png,image/jpeg,image/webp" required /></label>
        <label>{t("OCR language")}<select className="form-control" name="language" defaultValue={language}>
          <option value="en">English</option><option value="hi">हिंदी + English</option>
        </select></label>
        <button className="button">{t(busy ? "Reading prescription…" : "Extract medicines")}</button>
      </fieldset></form><ErrorMessage message={error} />
    </section>
    <section className="panel"><h2>{t("Enter prescription manually")}</h2>
      <RecordForm submitLabel={savedId ? "Retry saving text" : "Save prescription"} fields={[
        { name: "fileName", label: "Prescription file name", required: true },
        { name: "fileUrl", label: "Existing file URL (optional)", type: "url" },
        { name: "extractedText", label: "Prescription text (optional)", type: "textarea" },
      ]} onSubmit={async ({ extractedText, ...data }) => {
        const id = savedId || (await prescriptionApi.create(data)).prescription.id;
        setSavedId(id);
        if (extractedText) await prescriptionApi.saveOcr(id, { extractedText, language });
        router.push("/prescriptions/" + id + (extractedText ? "/ocr" : ""));
      }} />
    </section>
  </>;
}
