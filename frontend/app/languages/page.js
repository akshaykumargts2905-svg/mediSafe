"use client";
import { useState } from "react";
import ApiPanel from "../../components/ApiPanel";
import RecordForm from "../../components/RecordForm";
import { api, json } from "../../lib/api";
export default function Languages() {
  const [translation, setTranslation] = useState(null);
  return <ApiPanel title="Languages" description="View available languages and try the translation preview." endpoint="/api/languages">
    {({ data }) => Array.isArray(data) && <>
      <section className="panel"><h2>Available languages</h2>{data.map((language) => <span className="badge" key={language.code}>{language.name} · {language.code}</span>)}</section>
      <section className="panel"><h2>Translation preview</h2><p>Translation is not enabled yet. This preview returns your original text unchanged.</p>
        <RecordForm submitLabel="Preview translation" fields={[{ name: "text", label: "Text", type: "textarea", required: true }, { name: "language", label: "Language", required: true, options: data.map((language) => ({ value: language.code, label: language.name })) }]} onSubmit={async (values) => { setTranslation(null); setTranslation(await api("/api/translate", json("POST", values))); }} />
        {translation && <p className="feedback preserve-lines" role="status">{translation.translatedText}{translation.placeholder && <small> — Original text (translation placeholder)</small>}</p>}
      </section>
    </>}
  </ApiPanel>;
}
