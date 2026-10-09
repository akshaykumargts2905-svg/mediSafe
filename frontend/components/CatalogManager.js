"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ApiPanel from "./ApiPanel";
import RecordForm from "./RecordForm";
import ErrorMessage from "./ErrorMessage";
import { api, json } from "../lib/api";
import { authApi } from "../lib/services";
import { patientText, useLanguage } from "../lib/i18n";
import ClinicalResult from "./ClinicalResult";
import { catalogs } from "../lib/catalog";

export default function CatalogManager({ kind, navigation }) {
  const { language, t } = useLanguage();
  const config = catalogs[kind];
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState(null);
  const [editor, setEditor] = useState(null);
  const [options, setOptions] = useState({});
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([authApi.me(), ...(kind === "drug" || kind === "food" ? [api("/api/medicines"), api("/api/foods")] : [])]).then(([profile, medicines, foods]) => {
      if (active) { setCanEdit(Boolean(profile.permissions?.catalogEditor)); setOptions({ medicines: medicines?.medicines || [], foods: foods?.foods || [] }); }
    }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [kind]);
  const fields = config.fields.map((field) => field.source ? { ...field, options: (options[field.source] || []).map((item) => ({ value: item.id, label: item.name })) } : field);
  async function open(item, editing = false) {
    setLoadingDetail(true); setError("");
    try {
      const response = await api(config.path + "/" + item.id);
      if (editing) setEditor(response[config.itemKey]);
      else setSelection(response[config.itemKey]);
    } catch (failure) { setError(failure.message); }
    finally { setLoadingDetail(false); }
  }
  const title = (item) => (kind === "foods" ? patientText(item, "name", language) : item.name) || (item.medicineA?.name ? item.medicineA.name + " + " + item.medicineB.name : item.medicine?.name ? item.medicine.name + " + " + patientText(item.food, "name", language) : "Interaction #" + item.id);
  return <ApiPanel key={kind + search} title={config.title} description="Browse shared records. Changes are available to authorized catalog editors." endpoint={kind === "medicines" && search ? "/api/medicines/search?q=" + encodeURIComponent(search) : config.path}>
    {({ data, refresh, run, busy }) => <>
      {navigation}
      <div className="toolbar">
        {kind === "medicines" && <form className="search-form" onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); }}><input className="form-control" aria-label="Search medicines" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, brand, generic or RxCUI" /><button className="button secondary">Search</button></form>}
        {canEdit && <button className="button" onClick={() => { setEditor({}); setSelection(null); }}>Add record</button>}
      </div>
      <ErrorMessage message={error} />
      {loadingDetail && <p role="status">Loading record…</p>}
      {!canEdit && <p className="fine-print">You have read access to this catalog.</p>}
      {editor && canEdit && <section className="panel"><h2>{editor.id ? "Edit record" : "New record"}</h2>
        <RecordForm key={editor.id || "new"} fields={fields} initial={editor} onCancel={() => setEditor(null)} onSubmit={async (values) => {
          await api(config.path + (editor.id ? "/" + editor.id : ""), json(editor.id ? "PUT" : "POST", values));
          setEditor(null); setSelection(null); await refresh();
        }} />
      </section>}
      {selection?.severity && <ClinicalResult record={selection} alternatives />}
      {selection && <section className="panel"><h2>{title(selection)}</h2><dl className="details">{config.fields.map((field) => <div key={field.name}><dt>{field.label}</dt><dd>{field.source ? (options[field.source] || []).find((item) => item.id === selection[field.name])?.name || selection[field.name] : Array.isArray(selection[field.name]) ? selection[field.name].join(", ") || "Not recorded" : selection[field.name] || "Not recorded"}</dd></div>)}</dl>
        {kind === "medicines" && <Link className="button secondary" href={"/knowledge-graph/medicine/" + selection.id}>View relationships</Link>}
        <button className="text-button" onClick={() => setSelection(null)}>{t("Close details")}</button>
      </section>}
      <div className="list">{(data?.[config.listKey] || []).map((item) => <article className="row-card" key={item.id}><div><b>{title(item)}</b><p>{patientText(item, "description", language) || item.genericName || "Record #" + item.id}</p>{item.severity && <span className={"badge " + item.severity.toLowerCase()}>{t(item.severity)}</span>}</div>
        <div className="toolbar"><button className="button secondary" disabled={loadingDetail} onClick={() => open(item)}>{t("Details")}</button>
          {canEdit && <><button className="button secondary" disabled={loadingDetail} onClick={() => open(item, true)}>{t("Edit")}</button><button className="button danger" disabled={busy} onClick={async () => { if (confirm("Delete this shared record? Related records may also be removed.")) { const result = await run({ path: config.path + "/" + item.id, method: "DELETE", success: "Record deleted." }); if (result) { setSelection(null); setEditor(null); } } }}>{t("Delete")}</button></>}
        </div></article>)}</div>
      {!busy && !data?.[config.listKey]?.length && <p className="empty-state">No records match this view.</p>}
    </>}
  </ApiPanel>;
}
