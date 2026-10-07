"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import OcrEditor from "../../../../components/OcrEditor";
function Content() { const { id } = useParams(); return <OcrEditor id={id} />; }
export default function Page() { return <Suspense fallback={<p>Loading prescription…</p>}><Content /></Suspense>; }
