"use client";
import { useState } from "react";
import ApiPanel from "../../components/ApiPanel";
import RecordForm from "../../components/RecordForm";
import SpeakButton from "../../components/SpeakButton";
import { useLanguage } from "../../lib/i18n";
import { api, json } from "../../lib/api";
export default function Languages() {
  const { language, t } = useLanguage();
  const [translation, setTranslation] = useState(null);
  return <ApiPanel title="Languages" description="Review safety information with your healthcare professional." endpoint="/api/languages">
    {({ data }) => Array.isArray(data) && <>
      <section className="panel"><h2>{t("Available languages")}</h2>{data.map((item) => <span className="badge" key={item.code}>{item.name} ? {item.code}</span>)}</section>
      <section className="panel"><h2>{t("Translation")}</h2>
        <RecordForm key={language} initial={{ source: language === "en" ? "hi" : "en", language }} submitLabel="Translate" fields={[
          { name: "text", label: "Text", type: "textarea", required: true },
          { name: "source", label: "Source language", required: true, options: data.map((item) => ({value:item.code,label:item.name})) },
          { name: "language", label: "Target language", required: true, options: data.map((item) => ({value:item.code,label:item.name})) },
        ]} onSubmit={async (values) => { setTranslation(null); setTranslation(await api("/api/translate", json("POST", values))); }} />
        {translation && <div className="feedback preserve-lines" role="status"><p>{translation.translatedText}</p><SpeakButton key={translation.language + translation.translatedText} language={translation.language} text={translation.translatedText} /></div>}
      </section>
    </>}
  </ApiPanel>;
}
