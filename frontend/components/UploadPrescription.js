"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RecordForm from "./RecordForm";
import { prescriptionApi } from "../lib/services";

export default function UploadPrescription() {
  const router = useRouter();
  const [savedId, setSavedId] = useState(null);
  return <section className="panel"><p>Save the prescription name and an optional link. File storage and automatic text extraction are not available yet.</p>
    <RecordForm submitLabel={savedId ? "Retry saving text" : "Save prescription"} fields={[
      { name: "fileName", label: "Prescription file name", required: true },
      { name: "fileUrl", label: "Existing file URL (optional)", type: "url" },
      { name: "extractedText", label: "Prescription text (optional)", type: "textarea" },
    ]} onSubmit={async ({ extractedText, ...data }) => {
      // If text saving fails, retry against the same prescription instead of creating a duplicate.
      const id = savedId || (await prescriptionApi.create(data)).prescription.id;
      setSavedId(id);
      if (extractedText) await prescriptionApi.saveOcr(id, { extractedText });
      router.push("/prescriptions/" + id);
    }} />
  </section>;
}
