"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ApiPanel from "../../../components/ApiPanel";
function Content() { const { id } = useParams(); return <ApiPanel title="Medicine details" endpoint={`/api/medicines/${id}`}>{({ data }) => data?.medicine && <section className="panel"><h2>{data.medicine.name}</h2><dl className="details">{[["strength", "Strength"], ["dosageForm", "Dosage form"], ["genericName", "Generic name"], ["brandName", "Brand name"], ["rxCui", "RxCUI"], ["atcCode", "ATC code"]].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{data.medicine[key] || "Not recorded"}</dd></div>)}</dl><div className="toolbar"><Link className="button secondary" href={"/knowledge-graph/medicine/" + id}>View relationships</Link><Link className="button secondary" href="/medicines">Manage catalog</Link></div></section>}</ApiPanel>; }
export default function Medicine() { return <Suspense fallback={<p>Loading medicine…</p>}><Content /></Suspense>; }
