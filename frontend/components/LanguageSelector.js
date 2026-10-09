"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n";
import { saveLanguage } from "../lib/language";
import { api, getToken, json } from "../lib/api";

export default function LanguageSelector() {
  const { language, t } = useLanguage();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <div>
    <select aria-label="Language / भाषा" value={language} disabled={busy} className="form-control" onChange={async (event) => {
      const value = event.target.value;
      setBusy(true); setError("");
      try { if (getToken()) await api("/api/users/me", json("PUT", { language: value })); saveLanguage(value); }
      catch (failure) { setError(failure.message); } finally { setBusy(false); }
    }}><option value="en">English</option><option value="hi">हिंदी</option></select>
    {error && <small role="alert">{t(error)}</small>}
  </div>;
}
