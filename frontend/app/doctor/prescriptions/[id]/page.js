"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../../components/ApiPanel";
function Content() {
  const { id } = useParams();
  return (
    <ApiPanel
      title={`Patient prescription #${id}`}
      description="Patient, medicines, OCR, alerts and report data from the doctor API."
      endpoint={`/api/doctor/prescriptions/${id}`}
    />
  );
}
export default function DoctorPrescriptionDetail() {
  return (
    <Suspense fallback={<p>Loading case…</p>}>
      <Content />
    </Suspense>
  );
}
