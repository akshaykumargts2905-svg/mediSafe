"use client";
import ApiPanel from "../../components/ApiPanel";
export default function Alerts() {
  return (
    <ApiPanel
      title="Safety alerts"
      description="Alerts returned by your MediSafe backend."
      endpoint="/api/alerts"
    >
      {({ data, run }) => {
        const rows = data?.alerts || [];
        return rows.length ? (
          <div className="list">
            {rows.map((a) => (
              <article className="row-card" key={a.id}>
                <span>
                  <b>{a.title}</b>
                  <p>{a.message}</p>
                  <span className={`badge ${(a.severity || "").toLowerCase()}`}>
                    {a.severity || "NOTICE"}
                  </span>
                  {a.language && <span>　{a.language}</span>}
                </span>
                <div className="toolbar">
                  <button
                    className="button secondary"
                    onClick={() =>
                      run({
                        path: `/api/alerts/${a.id}/read`,
                        method: "PATCH",
                        success: "Alert marked as read.",
                      })
                    }
                  >
                    Mark read
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      run({
                        path: `/api/alerts/${a.id}`,
                        method: "DELETE",
                        success: "Alert deleted.",
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No alerts were returned.</p>
        );
      }}
    </ApiPanel>
  );
}
