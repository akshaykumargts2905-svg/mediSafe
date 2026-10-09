"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../../components/ApiPanel";
import ClinicalResult, { Alternatives } from "../../../../components/ClinicalResult";
function Content() {
  const {id} = useParams();
  return <ApiPanel title="Knowledge graph" endpoint={`/api/knowledge-graph/medicine/${id}`}>
    {({data}) => {
      const medicine = data?.medicine;
      if (!medicine) return null;
      const drugs = [...medicine.interactionsAsA.map((row) => ({...row,medicineA:medicine})),...medicine.interactionsAsB.map((row) => ({...row,medicineB:medicine}))];
      return <><h2>{medicine.name}</h2>{drugs.map((row) => <ClinicalResult key={"drug-"+row.id} record={row} />)}
        {medicine.foodInteractions.map((row) => <ClinicalResult key={"food-"+row.id} record={{...row,medicine}} />)}
        <Alternatives rows={medicine.alternatives} />
        {!drugs.length && !medicine.foodInteractions.length && <p className="empty-state">No relationships recorded for this medicine.</p>}
      </>;
    }}
  </ApiPanel>;
}
export default function MedicineGraph(){return <Suspense fallback={<p>Loading relationships…</p>}><Content /></Suspense>}
