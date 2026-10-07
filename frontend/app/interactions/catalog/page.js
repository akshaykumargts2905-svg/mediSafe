"use client";
import { useState } from "react";
import CatalogManager from "../../../components/CatalogManager";
export default function InteractionCatalog() {
  const [kind, setKind] = useState("drug");
  return <CatalogManager key={kind} kind={kind} navigation={<nav className="toolbar" aria-label="Interaction type"><button className="button secondary" aria-pressed={kind === "drug"} onClick={() => setKind("drug")}>Drug–drug records</button><button className="button secondary" aria-pressed={kind === "food"} onClick={() => setKind("food")}>Drug–food records</button></nav>} />;
}
