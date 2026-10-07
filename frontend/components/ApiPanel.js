"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Workspace from "./Workspace";

export default function ApiPanel({ title, description, endpoint, initialMethod = "GET", actions = [], children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState("");
  async function refresh() { setBusy(true); setError(""); try { setData(await api(endpoint, { method: initialMethod })); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  useEffect(() => {
    let active = true;
    api(endpoint, { method: initialMethod }).then((value) => { if (active) setData(value); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [endpoint, initialMethod]);
  async function run(action) { setBusy(true); setError(""); setNotice(""); try { const result = await api(action.path || endpoint, { method: action.method || "POST", ...(action.body ? { body: JSON.stringify(action.body) } : {}) }); setNotice(action.success || "Changes saved."); if (action.path && action.path !== endpoint) await refresh(); else setData(result); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <Workspace title={title} description={description}><div className="toolbar">{actions.map((a) => <button className="button" key={a.label} disabled={busy} onClick={() => run(a)}>{a.label}</button>)}<button className="button secondary" onClick={refresh} disabled={busy}>Refresh</button></div>{busy && <p className="feedback">Loading MediSafe data…</p>}{error && <p className="feedback error">{error}</p>}{notice && <p className="feedback success">{notice}</p>}{children?.({ data, refresh, run, busy })}{!children && data && <pre className="data-view">{JSON.stringify(data, null, 2)}</pre>}{!busy && !error && !data && <p className="empty-state">No data returned by the service yet.</p>}</Workspace>;
}
