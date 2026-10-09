"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Workspace from "./Workspace";
import { api, json } from "../lib/api";
import { patientText, useLanguage } from "../lib/i18n";
import ClinicalResult from "./ClinicalResult";
import SpeakButton from "./SpeakButton";

const emptyCatalog = { medicines: [], foods: [], loading: true, error: "" };

export default function InteractionCheck({ food = false }) {
  const { language, t } = useLanguage();
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [attempt, setAttempt] = useState(0);
  const [medicineA, setA] = useState("");
  const [medicineB, setB] = useState("");
  const [foodId, setFood] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { medicines, foods, loading, error: catalogError } = catalog;

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    Promise.all([
      api("/api/medicines", options),
      food ? api("/api/foods", options) : Promise.resolve({ foods: [] }),
    ]).then(([medicineData, foodData]) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(medicineData?.medicines) || !Array.isArray(foodData?.foods)) {
        throw new Error("The catalog response is invalid. Please try again.");
      }
      setCatalog({ medicines: medicineData.medicines, foods: foodData.foods, loading: false, error: "" });
    }).catch((failure) => {
      if (!controller.signal.aborted) {
        setCatalog({ ...emptyCatalog, loading: false, error: failure.message });
      }
    });
    return () => controller.abort();
  }, [food, attempt]);

  function refreshCatalog() {
    setCatalog(emptyCatalog);
    setA("");
    setB("");
    setFood("");
    setResult(null);
    setError("");
    setAttempt((previous) => previous + 1);
  }

  async function check(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await api(food ? "/api/food-interactions/check" : "/api/drug-interactions/check", json("POST", food
        ? { medicineId: Number(medicineA), foodId: Number(foodId) }
        : { medicineAId: Number(medicineA), medicineBId: Number(medicineB) })));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  const hit = result?.interaction;
  const unavailable = loading || Boolean(catalogError) || busy;
  return <Workspace title={food ? "Drug–food check" : "Drug–drug check"} description="Choose items from the live backend catalog to check known interactions.">
    <div className="toolbar">
      <button className="button secondary" disabled={loading || busy} onClick={refreshCatalog}>
        {t(catalogError ? "Retry loading catalog" : "Refresh catalog")}
      </button>
    </div>
    {loading && <p className="feedback" role="status">{t("Loading medicine catalog…")}</p>}
    {catalogError && <p className="feedback error" role="alert">{catalogError}</p>}
    {!loading && !catalogError && !medicines.length && <p className="empty-state">
      {t("No medicines have been added to the catalog yet.")} {t("Ask a catalog editor to add records, then refresh.")} <Link href="/medicines">{t("Medicine catalog")}</Link>
    </p>}
    {!loading && !catalogError && food && !foods.length && <p className="empty-state">
      {t("No foods have been added to the catalog yet.")} {t("Ask a catalog editor to add records, then refresh.")} <Link href="/foods">{t("Food catalog")}</Link>
    </p>}
    <form className="panel" onSubmit={check}>
      <div className="form-row">
        <label>{t("Medicine")}<select className="form-control" required disabled={unavailable || !medicines.length} value={medicineA} onChange={(event) => { setA(event.target.value); setResult(null); }}>
          <option value="">{t("Select a medicine")}</option>
          {medicines.map((medicine) => <option value={medicine.id} key={medicine.id}>{medicine.name}</option>)}
        </select></label>
        {food ? <label>{t("Food")}<select className="form-control" required disabled={unavailable || !foods.length} value={foodId} onChange={(event) => { setFood(event.target.value); setResult(null); }}>
          <option value="">{t("Select a food")}</option>
          {foods.map((item) => <option value={item.id} key={item.id}>{patientText(item, "name", language)}</option>)}
        </select></label> : <label>{t("Second medicine")}<select className="form-control" required disabled={unavailable || !medicines.length} value={medicineB} onChange={(event) => { setB(event.target.value); setResult(null); }}>
          <option value="">{t("Select a medicine")}</option>
          {medicines.map((medicine) => <option value={medicine.id} key={medicine.id}>{medicine.name}</option>)}
        </select></label>}
      </div>
      <button className="button" disabled={unavailable || !medicineA || !(food ? foodId : medicineB)}>{t(busy ? "Checking…" : "Check interaction")}</button>
    </form>
    {error && <p className="feedback error" role="alert">{error}</p>}
    {result && (hit ? <ClinicalResult record={hit} alternatives /> : <section className="panel">
      <h2>{t("No matching interaction found")}</h2>
      <p>{t("This check only searches stored interaction records. No match does not establish that the selected combination is safe.")}</p>
      <SpeakButton key={language} text={t("This check only searches stored interaction records. No match does not establish that the selected combination is safe.")} />
    </section>)}
  </Workspace>;
}
