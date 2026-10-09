"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import ApiPanel from "../../../../components/ApiPanel";
import SpeakButton from "../../../../components/SpeakButton";
import { patientText, useLanguage } from "../../../../lib/i18n";
function Content() {
  const {id} = useParams();
  const {language,t} = useLanguage();
  return <ApiPanel title="Safety report" description="Review safety information with your healthcare professional." allowMissing endpoint={`/api/safety-reports/${id}`} actions={[{label:"Generate report",path:`/api/safety-reports/generate/${id}`,success:"Report generated."}]}>
    {({data}) => {
      const report=data?.report;
      if (!report) return <p className="empty-state">{t("No record yet.")}</p>;
      const summary=patientText(report,"summary",language);
      return <><div className="stat-grid">{[["Total medicines",report.totalMedicines],["Total alerts",report.totalAlerts],["High risk alerts",report.highRiskCount],["Overall status",t(report.overallStatus.replaceAll("_"," "))]].map(([label,value]) => <div className="stat" key={label}><span>{t(label)}</span><b className="small-stat">{value}</b></div>)}</div>
        <section className="panel"><p className="eyebrow">{t("SUMMARY")}</p><p>{summary}</p><p className="fine-print">{t("No known alerts does not establish clinical safety. Review medication decisions with your care team.")}</p><SpeakButton key={language} text={summary} /></section></>;
    }}
  </ApiPanel>;
}
export default function Report(){return <Suspense fallback={<p>Loading report…</p>}><Content /></Suspense>}
