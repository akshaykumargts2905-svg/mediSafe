"use client";
import ApiPanel from "../../components/ApiPanel";
export default function Doctor() {
  return (
    <ApiPanel
      title="Doctor dashboard"
      description="Case and recommendation summary from the doctor service."
      endpoint="/api/doctor/dashboard"
    >
      {({ data }) =>
        data && (
          <div className="stat-grid">
            {Object.entries(data).map(([key, value]) => (
              <div className="stat" key={key}>
                <span>
                  {key
                    .replace(/[A-Z]/g, " $&")
                    .replace(/^./, (s) => s.toUpperCase())}
                </span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        )
      }
    </ApiPanel>
  );
}
