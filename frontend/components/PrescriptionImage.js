"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";
import ErrorMessage from "./ErrorMessage";

export default function PrescriptionImage({ id }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true, objectUrl;
    const controller = new AbortController();
    api("/api/prescriptions/" + id + "/image", { responseType: "blob", signal: controller.signal })
      .then((blob) => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } })
      .catch((failure) => { if (active && failure.status !== 404) setError(failure.message); });
    return () => { active = false; controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return <><ErrorMessage message={error} />{url && <details className="panel"><summary>{t("Prescription image")}</summary>
    {/* Authenticated private blob; Next image optimization cannot forward the patient's bearer token. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="prescription-image" src={url} alt={t("Prescription image")} />
  </details>}</>;
}
