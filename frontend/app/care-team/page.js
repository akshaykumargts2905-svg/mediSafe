"use client";
import ApiPanel from "../../components/ApiPanel";
import RecordForm from "../../components/RecordForm";
import { api, json } from "../../lib/api";
import { useLanguage } from "../../lib/i18n";
export default function CareTeam() {
  const { t } = useLanguage();
  return <ApiPanel title="Care team" description="Only doctors you approve can review your prescriptions, OCR, alerts and recommendations." endpoint="/api/care-team">
    {({data, refresh, run, busy}) => <>
      <section className="panel"><h2>{t("Share with a doctor")}</h2><RecordForm submitLabel="Grant access" fields={[{name:"email",label:"Doctor email",type:"email",required:true}]} onSubmit={async (values) => { await api("/api/care-team", json("POST",values)); await refresh(); }} /></section>
      {(data?.doctors || []).map((row) => <article className="row-card" key={row.doctorId}><div><b>{row.doctor.name}</b><p>{row.doctor.email}</p></div>
        <button className="button danger" disabled={busy} onClick={() => run({path:"/api/care-team/"+row.doctorId,method:"DELETE"})}>{t("Revoke access")}</button>
      </article>)}
      {!busy && !data?.doctors?.length && <p className="empty-state">{t("No doctors have access to your records.")}</p>}
    </>}
  </ApiPanel>;
}
