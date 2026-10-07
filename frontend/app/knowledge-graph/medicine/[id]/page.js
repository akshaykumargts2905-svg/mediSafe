"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../../components/ApiPanel";
function Content() {
  const { id } = useParams();
  return (
    <ApiPanel
      title={`Medicine relationships · ${id}`}
      endpoint={`/api/knowledge-graph/medicine/${id}`}
    />
  );
}
export default function MedicineGraph() {
  return (
    <Suspense fallback={<p>Loading graph…</p>}>
      <Content />
    </Suspense>
  );
}
