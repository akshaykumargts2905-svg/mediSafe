export default function StatusBadge({ status }) { const value = String(status || "UNKNOWN"); return <span className={`badge ${value.toLowerCase()}`}>{value.replaceAll("_", " ")}</span>; }
