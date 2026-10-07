"use client";
import ApiPanel from "../../components/ApiPanel";
export default function Graph() {
  return (
    <ApiPanel
      title="Knowledge graph"
      description="Medicine and food relationships returned by the backend."
      endpoint="/api/knowledge-graph"
    >
      {({ data }) => {
        if (!data) return null;
        const meds = data.medicines || [],
          foods = data.foods || [],
          drug = data.drugInteractions || [],
          foodLinks = data.foodInteractions || [],
          names = new Map([...meds, ...foods].map((x) => [x.id, x.name]));
        return (
          <>
            <section className="panel">
              <h2>Catalog nodes</h2>
              <div className="toolbar">
                {[...meds, ...foods].map((x) => (
                  <span className="badge" key={`${x.id}-${x.name}`}>
                    {x.name}
                  </span>
                ))}
              </div>
            </section>
            <section className="panel">
              <h2>Drug–drug relationships</h2>
              {drug.length ? (
                <div className="list">
                  {drug.map((x) => (
                    <div className="row-card" key={x.id}>
                      <b>
                        {names.get(x.medicineAId) ||
                          `Medicine ${x.medicineAId}`}{" "}
                        ↔{" "}
                        {names.get(x.medicineBId) ||
                          `Medicine ${x.medicineBId}`}
                      </b>
                      <span
                        className={`badge ${(x.severity || "").toLowerCase()}`}
                      >
                        {x.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No drug relationships returned.</p>
              )}
            </section>
            <section className="panel">
              <h2>Drug–food relationships</h2>
              {foodLinks.length ? (
                <div className="list">
                  {foodLinks.map((x) => (
                    <div className="row-card" key={x.id}>
                      <b>
                        {names.get(x.medicineId) || `Medicine ${x.medicineId}`}{" "}
                        ↔ {names.get(x.foodId) || `Food ${x.foodId}`}
                      </b>
                      <span
                        className={`badge ${(x.severity || "").toLowerCase()}`}
                      >
                        {x.severity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No food relationships returned.</p>
              )}
            </section>
          </>
        );
      }}
    </ApiPanel>
  );
}
