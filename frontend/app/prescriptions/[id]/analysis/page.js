"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import Analysis from "../../../../components/Analysis";
function Content() { const { id } = useParams(); return <Analysis id={id} />; }
export default function Page() { return <Suspense fallback={<p>Loading prescription…</p>}><Content /></Suspense>; }
