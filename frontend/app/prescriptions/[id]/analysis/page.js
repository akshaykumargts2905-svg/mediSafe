"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../../components/ApiPanel";
function Content() {
  const { id } = useParams();
  return (
    <ApiPanel
      title="Safety analysis"
      description="Analysis and safety findings returned for this prescription."
      endpoint={`/api/analyze/${id}`}
      initialMethod="POST"
      actions={[
        {
          label: "Run analysis",
          path: `/api/analyze/${id}`,
          method: "POST",
          success: "Analysis refreshed.",
        },
      ]}
    />
  );
}
export default function Analysis() {
  return (
    <Suspense fallback={<p>Loading analysis…</p>}>
      <Content />
    </Suspense>
  );
}
