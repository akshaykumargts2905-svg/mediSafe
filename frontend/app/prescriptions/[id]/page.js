"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import PrescriptionDetails from "../../../components/PrescriptionDetails";
function Content() { const { id } = useParams(); return <PrescriptionDetails id={id} doctor={false} />; }
export default function Page() { return <Suspense fallback={<p>Loading prescription…</p>}><Content /></Suspense>; }
