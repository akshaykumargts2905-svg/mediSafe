"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ApiPanel from "./ApiPanel";
import ErrorMessage from "./ErrorMessage";
import { api } from "../lib/api";
import { prescriptionApi } from "../lib/services";
export default function Analysis({ id }) {
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
  return <ApiPanel title="Safety analysis" description="Check linked medicines against recorded interactions. Run a check when you are ready." endpoint={`/api/prescriptions/${id}`}>
    {({ data }) => <>
      <form className="panel" onSubmit={async (event) => {
        event.preventDefault(); setRunning(true); setError(""); setResult(null);
        try { setResult(await prescriptionApi.analyze(id, mode === "all" ? {} : { foodIds: mode === "none" ? [] : selected })); }
        catch (failure) { setError(failure.message); } finally { setRunning(false); }
      }}><p>{data?.prescription?.medicines?.length || 0} linked medicines. Analysis refreshes generated alerts and the latest safety report.</p>
        <label>Food checks<select className="form-control" value={mode} onChange={(event) => setMode(event.target.value)}><option value="all">All known food cautions</option><option value="none">No food checks</option><option value="selected">Selected foods only</option></select></label>
        {mode === "selected" && <label>Foods<select className="form-control" multiple required value={selected.map(String)} onChange={(event) => setSelected([...event.target.selectedOptions].map((option) => Number(option.value)))}>{foods.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}</select></label>}
        <button className="button" disabled={running || !data?.prescription}>{running ? "Analyzing…" : "Run analysis"}</button>
      </form><ErrorMessage message={error} />
      {result && <section className="panel" aria-live="polite"><h2>{result.report.overallStatus.replaceAll("_", " ")}</h2><p>{result.report.summary}</p>
        {result.alerts.map((alert) => <article className="row-card" key={alert.id}><div><b>{alert.title}</b><p>{alert.message}</p></div><span className={"badge " + alert.severity.toLowerCase()}>{alert.severity}</span></article>)}
        <Link className="button secondary" href={`/prescriptions/${id}/report`}>View safety report</Link>
        <p className="fine-print">No known alerts does not establish clinical safety. Review medication decisions with your care team.</p>
      </section>}
    </>}
  </ApiPanel>;
}
