"use client";

import { useId, useState } from "react";
import ErrorMessage from "./ErrorMessage";
import { useLanguage } from "../lib/i18n";

// Reused by catalog, profile, OCR and prescription forms.
export default function RecordForm({ fields, initial = {}, onSubmit, submitLabel = "Save", onCancel }) {
  const { t } = useLanguage();
  const formId = useId();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const data = {};
    for (const field of fields) {
      const value = values.get(field.name);
      if (field.type === "checkbox") data[field.name] = value === "on";
      else if (value !== null && String(value).trim() !== "") {
        data[field.name] = field.type === "number" ? Number(value) : field.type === "tags" ? String(value).split(",").map((item) => item.trim()).filter(Boolean) : value;
      } else if (field.type === "tags") data[field.name] = [];
      else if (field.nullable) data[field.name] = null;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      await onSubmit(data);
      setNotice("Saved successfully.");
    } catch (failure) {
      setError(failure.message || "Could not save changes.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="record-form">
    <fieldset disabled={busy}>
      <div className="form-row">
        {fields.map((field) => <div key={field.name} className={field.type === "textarea" ? "field-control wide-field" : "field-control"}>
          <label htmlFor={formId + field.name}>{t(field.label)}{field.required ? " *" : ""}</label>
          {field.options ? <select id={formId + field.name} className="form-control" name={field.name} defaultValue={initial[field.name] ?? ""} required={field.required}>
            <option value="">— {t(field.label)} —</option>
            {field.options.map((option) => <option key={option.value} value={option.value}>{field.source ? option.label : t(option.label)}</option>)}
          </select> : field.type === "textarea" ? <textarea id={formId + field.name} className="form-control" name={field.name} rows={4} defaultValue={initial[field.name] ?? ""} required={field.required} />
              : <input id={formId + field.name} className="form-control" name={field.name} type={field.type === "tags" ? "text" : field.type || "text"} defaultValue={field.type === "checkbox" ? undefined : field.type === "tags" ? (initial[field.name] || []).join(", ") : initial[field.name] ?? ""} defaultChecked={field.type === "checkbox" ? Boolean(initial[field.name]) : undefined} required={field.required} min={field.min} max={field.max} step={field.step} minLength={field.minLength} autoComplete={field.autoComplete} />}
          {field.help && <small>{field.help}</small>}
        </div>)}
      </div>
      <div className="toolbar">
        <button className="button" type="submit">{t(busy ? "Saving…" : submitLabel)}</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel}>{t("Cancel")}</button>}
      </div>
    </fieldset>
    <ErrorMessage message={error} />
    {notice && <p className="feedback success" role="status">{t(notice)}</p>}
  </form>;
}
