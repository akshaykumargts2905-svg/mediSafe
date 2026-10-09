"use client";
import { patientText, useLanguage } from "../lib/i18n";
import SpeakButton from "./SpeakButton";

export function Alternatives({ rows = [] }) {
  const { language, t } = useLanguage();
  if (!rows.length) return null;
  return <section className="panel"><h2>{t("For clinician review")}</h2>{rows.map((row) => <article key={row.id}>
    <b>{row.medicine?.name ? row.medicine.name + " → " : ""}{row.alternativeMedicine?.name}</b><p>{patientText(row, "reason", language)}</p>
    {row.sourceUrl && <a className="text-button" href={row.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Source")} ↗</a>}
  </article>)}<p className="fine-print">{t("Review this result with your doctor or pharmacist. Do not start, stop or replace a medicine based on this check alone.")}</p></section>;
}

export default function ClinicalResult({ record, title, alternatives = false }) {
  const { language, t } = useLanguage();
  const heading = title || record.title || [record.medicineA?.name || record.medicine?.name, record.medicineB?.name || patientText(record.food, "name", language)].filter(Boolean).join(" + ");
  const description = patientText(record, record.message ? "message" : "description", language);
  const risk = patientText(record, "risk", language);
  const action = patientText(record, "recommendation", language);
  const missingHindi = [record.message ? "message" : "description", "risk", "recommendation"].some((field) => record[field] && !record[field + "Hi"]);
  const guidance = t("Review this result with your doctor or pharmacist. Do not start, stop or replace a medicine based on this check alone.");
  const rows = [...(record.medicineA?.alternatives || []), ...(record.medicineB?.alternatives || []), ...(record.medicine?.alternatives || [])];
  return <section className="panel clinical-result">
    <h2>{heading} <span className={"badge " + (record.severity || "").toLowerCase()}>{t(record.severity || "")}</span></h2>
    <p><b>{t("What this means")}:</b> {description}</p>
    {risk && <p><b>{t("Possible risk")}:</b> {risk}</p>}
    <p><b>{t("Recommended action")}:</b> {action || t("No recommendation provided.")}</p>
    {language === "hi" && missingHindi && <p className="fine-print">{t("Original English text shown where Hindi is unavailable.")}</p>}
    <p className="fine-print">{guidance}</p>
    {record.sourceUrl && /^https?:\/\//.test(record.sourceUrl) && <a className="text-button" href={record.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Source")} ↗</a>}
    <SpeakButton key={language} text={[heading, t(record.severity), description, risk, action, guidance].filter(Boolean).join(". ")} />
    {alternatives && <Alternatives rows={rows} />}
  </section>;
}
