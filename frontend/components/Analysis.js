"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ApiPanel from "./ApiPanel";
import ErrorMessage from "./ErrorMessage";
import ClinicalResult, { Alternatives } from "./ClinicalResult";
import SpeakButton from "./SpeakButton";
import { api } from "../lib/api";
import { patientText, useLanguage } from "../lib/i18n";
import { prescriptionApi } from "../lib/services";

export default function Analysis({ id }) {
  const { language, t } = useLanguage();
  const [foods, setFoods] = useState([]);
  const [mode, setMode] = useState("all");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/api/foods").then((data) => { if (active) setFoods(data.foods); }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, []);
  return <ApiPanel title="Safety analysis" description="Review safety information with your healthcare professional." endpoint={`/api/prescriptions/${id}`}>
    {({ data }) => <>
      {data?.prescription?.ocrResult && data.prescription.ocrResult.status !== "CONFIRMED" && <p className="feedback"><Link href={`/prescriptions/${id}/ocr`}>{t("Review detected medicines")} →</Link></p>}
      <form className="panel" onSubmit={async (event) => {
        event.preventDefault(); setRunning(true); setError(""); setResult(null);
        try { setResult(await prescriptionApi.analyze(id, mode === "all" ? {} : { foodIds: mode === "none" ? [] : selected })); }
        catch (failure) { setError(failure.message); } finally { setRunning(false); }
      }}>
        <p>{t("Total medicines")}: {data?.prescription?.medicines?.length || 0}</p>
        <label>{t("Food check scope")}<select className="form-control" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="all">{t("All known food cautions")}</option><option value="none">{t("Skip food checks")}</option><option value="selected">{t("Selected foods only")}</option>
        </select></label>
        {mode === "selected" && <label>{t("Select foods")}<select className="form-control" multiple required value={selected.map(String)} onChange={(event) => setSelected([...event.target.selectedOptions].map((option) => Number(option.value)))}>{foods.map((food) => <option key={food.id} value={food.id}>{patientText(food, "name", language)}</option>)}</select></label>}
        <button className="button" disabled={running || !data?.prescription}>{t(running ? "Analyzing…" : "Run analysis")}</button>
      </form><ErrorMessage message={error} />
      {result && <div aria-live="polite">
        <section className="panel"><h2>{t(result.report.overallStatus.replaceAll("_", " "))}</h2>
          <p>{t("Total medicines")}: {result.report.totalMedicines} · {t("Total alerts")}: {result.report.totalAlerts}</p>
          <p className="fine-print">{t("No known alerts does not establish clinical safety. Review medication decisions with your care team.")}</p>
          <SpeakButton key={language} text={t(result.report.overallStatus.replaceAll("_", " ")) + ". " + t("No known alerts does not establish clinical safety. Review medication decisions with your care team.")} />
          <Link className="button secondary" href={`/prescriptions/${id}/report`}>{t("View safety report")}</Link>
        </section>
        {result.alerts.map((alert) => <ClinicalResult key={alert.id} record={alert} />)}
        <Alternatives rows={result.alternatives} />
      </div>}
    </>}
  </ApiPanel>;
}
