"use client";
import Link from "next/link";
import ApiPanel from "../../components/ApiPanel";
import ClinicalResult, { Alternatives } from "../../components/ClinicalResult";
import { useLanguage } from "../../lib/i18n";
export default function Graph() {
  const { t } = useLanguage();
  return <ApiPanel title="Knowledge graph" description="Explore recorded medicine and food relationships." endpoint="/api/knowledge-graph">
    {({data}) => data && <>
      <section className="panel"><h2>{t("Medicines")}</h2><div className="toolbar">{data.medicines.map((item) => <Link className="badge" key={item.id} href={"/knowledge-graph/medicine/"+item.id}>{item.name} ↗</Link>)}</div></section>
      <h2>{t("Drug–drug check")}</h2>{data.drugInteractions.map((item) => <ClinicalResult key={item.id} record={item} />)}
      <h2>{t("Drug–food check")}</h2>{data.foodInteractions.map((item) => <ClinicalResult key={item.id} record={item} />)}
      <Alternatives rows={data.alternatives} />
    </>}
  </ApiPanel>;
}
