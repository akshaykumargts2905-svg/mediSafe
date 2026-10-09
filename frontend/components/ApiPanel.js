"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import Workspace from "./Workspace";
import ErrorMessage from "./ErrorMessage";
import { useLanguage } from "../lib/i18n";
import Icon from "./Icon";

export default function ApiPanel({ title, description, endpoint, actions = [], allowMissing = false, children }) {
  const { language, t } = useLanguage();
  const [state, setState] = useState({ data: null, error: "", busy: true, notice: "" });
  const sequence = useRef(0);
  const controller = useRef(null);
  async function refresh() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const version = ++sequence.current;
    setState((previous) => ({ ...previous, busy: true, error: "" }));
    try {
      const data = await api(endpoint, { signal: abort.signal });
      if (version === sequence.current) setState((previous) => ({ ...previous, data, busy: false }));
    } catch (error) {
      if (abort.signal.aborted || version !== sequence.current) return;
      setState((previous) => ({ ...previous, data: null, busy: false, error: allowMissing && error.status === 404 ? "" : error.message }));
    }
  }
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    const version = ++sequence.current;
    api(endpoint, { signal: abort.signal }).then((data) => {
      if (version === sequence.current) setState({ data, error: "", busy: false, notice: "" });
    }).catch((error) => {
      if (!abort.signal.aborted && version === sequence.current) setState({ data: null, busy: false, notice: "", error: allowMissing && error.status === 404 ? "" : error.message });
    });
    // This mutable ref is a request counter, not a DOM node captured by the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { abort.abort(); sequence.current++; };
  }, [endpoint, allowMissing, language]);
  async function run(action) {
    setState((previous) => ({ ...previous, busy: true, error: "", notice: "" }));
    try {
      const result = await api(action.path || endpoint, { method: action.method || "POST", data: action.body });
      if (action.refresh !== false) await refresh();
      else setState((previous) => ({ ...previous, busy: false }));
      setState((previous) => ({ ...previous, notice: action.success || "Changes saved." }));
      return result;
    } catch (error) {
      setState((previous) => ({ ...previous, busy: false, error: error.message }));
      return null;
    }
  }
  return <Workspace title={title} description={description}>
    <div className="toolbar">{actions.map((action) => <button className="button" key={action.label} disabled={state.busy} onClick={() => run(action)}>{t(action.label)}</button>)}
      <button className="button secondary" onClick={refresh} disabled={state.busy}><Icon name="refresh" size={16} />{t("Refresh")}</button>
    </div>
    {state.busy && <p className="feedback" role="status">{t("Loading MediSafe data…")}</p>}
    <ErrorMessage message={state.error} />
    {state.notice && <p className="feedback success" role="status">{state.notice}</p>}
    {children?.({ ...state, refresh, run })}
    {!children && state.data && <pre className="data-view">{JSON.stringify(state.data, null, 2)}</pre>}
    {!state.busy && !state.error && !state.data && <p className="empty-state">{t("No record yet.")}</p>}
  </Workspace>;
}
