"use client";
import { useLanguage } from "../../lib/i18n";
import Link from "next/link";
import Workspace from "../../components/Workspace";
export default function Interactions() {
  const { t } = useLanguage();
  return (
    <Workspace
      title="Interaction checks"
      description="Review known medication and food interactions."
    >
      <div className="stat-grid">
        <Link className="panel" href="/interactions/drug-drug">
          <h2>{t("Drug–drug check")} →</h2>
          <p>Check two medicines against the backend interaction catalog.</p>
        </Link>
        <Link className="panel" href="/interactions/drug-food">
          <h2>{t("Drug–food check")} →</h2>
          <p>Check a medicine and food for a known interaction.</p>
        </Link>
      </div>
    </Workspace>
  );
}
