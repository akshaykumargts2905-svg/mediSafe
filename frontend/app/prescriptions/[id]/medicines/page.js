"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import PrescriptionMedicines from "../../../../components/PrescriptionMedicines";
function Content() { const { id } = useParams(); return <PrescriptionMedicines id={id} />; }
export default function Page() { return <Suspense fallback={<p>Loading prescription…</p>}><Content /></Suspense>; }
