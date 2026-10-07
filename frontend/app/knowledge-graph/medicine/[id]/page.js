"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ApiPanel from "../../../../components/ApiPanel";
function Content() {
  const { id } = useParams();
  return <ApiPanel title="Medicine relationships" endpoint={`/api/knowledge-graph/medicine/${id}`}>
    {({ data }) => data?.medicine && <section className="panel"><h2>{data.medicine.name}</h2>
      {[...data.medicine.interactionsAsA.map((item) => ({ ...item, related: item.medicineB })), ...data.medicine.interactionsAsB.map((item) => ({ ...item, related: item.medicineA }))].map((item) => <article className="row-card" key={"drug-" + item.id}><div><Link href={"/knowledge-graph/medicine/" + item.related.id}><b>{item.related.name}</b></Link><p>{item.description}</p><p>{item.recommendation}</p></div><span className="badge">{item.severity}</span></article>)}
      {data.medicine.foodInteractions.map((item) => <article className="row-card" key={"food-" + item.id}><div><b>{item.food.name}</b><p>{item.description}</p><p>{item.recommendation}</p></div><span className="badge">{item.severity}</span></article>)}
      {!data.medicine.interactionsAsA.length && !data.medicine.interactionsAsB.length && !data.medicine.foodInteractions.length && <p className="empty-state">No relationships recorded for this medicine.</p>}
    </section>}
  </ApiPanel>;
}
export default function MedicineGraph() { return <Suspense fallback={<p>Loading relationships…</p>}><Content /></Suspense>; }
