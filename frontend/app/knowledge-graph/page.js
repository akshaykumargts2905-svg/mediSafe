"use client";
import Link from "next/link";
import ApiPanel from "../../components/ApiPanel";
export default function Graph() {
  return <ApiPanel title="Knowledge graph" description="Explore recorded medicine and food relationships." endpoint="/api/knowledge-graph">
    {({ data }) => {
      if (!data) return null;
      const medicines = new Map(data.medicines.map((item) => [item.id, item.name]));
      const foods = new Map(data.foods.map((item) => [item.id, item.name]));
      return <>
        <section className="panel"><h2>Medicines</h2><div className="toolbar">{data.medicines.map((item) => <Link className="badge" key={item.id} href={"/knowledge-graph/medicine/" + item.id}>{item.name} ↗</Link>)}</div>{!data.medicines.length && <p className="empty-state">No medicines recorded.</p>}</section>
        <section className="panel"><h2>Drug–drug relationships</h2>{data.drugInteractions.map((item) => <article className="row-card" key={item.id}><div><b>{medicines.get(item.medicineAId)} ↔ {medicines.get(item.medicineBId)}</b><p>{item.description}</p></div><span className={"badge " + item.severity.toLowerCase()}>{item.severity}</span></article>)}{!data.drugInteractions.length && <p className="empty-state">No drug relationships recorded.</p>}</section>
        <section className="panel"><h2>Drug–food relationships</h2>{data.foodInteractions.map((item) => <article className="row-card" key={item.id}><div><b>{medicines.get(item.medicineId)} ↔ {foods.get(item.foodId)}</b><p>{item.description}</p></div><span className={"badge " + item.severity.toLowerCase()}>{item.severity}</span></article>)}{!data.foodInteractions.length && <p className="empty-state">No food relationships recorded.</p>}</section>
      </>;
    }}
  </ApiPanel>;
}
