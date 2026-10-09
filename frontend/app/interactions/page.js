"use client";
import { useLanguage } from "../../lib/i18n";
import Link from "next/link";
import Workspace from "../../components/Workspace";
import Icon from "../../components/Icon";
export default function Interactions() {
  const { t } = useLanguage();
  return (
    <Workspace
      title="Interaction checks"
      description="Review known medication and food interactions."
    >
      <div className="interaction-options">
        <Link className="panel interaction-option" href="/interactions/drug-drug">
          <span className="icon-tile"><Icon name="pill" size={29} /></span>
          <span className="eyebrow">MEDICINE + MEDICINE</span>
          <h2>{t("Drug–drug check")}</h2>
          <p>Understand how two medicines may interact, with clear information to discuss with your care team.</p>
          <span className="text-link">{t("Check medicines")} <Icon name="arrow" size={18} /></span>
        </Link>
        <Link className="panel interaction-option" href="/interactions/drug-food">
          <span className="icon-tile"><Icon name="leaf" size={29} /></span>
          <span className="eyebrow">MEDICINE + FOOD</span>
          <h2>{t("Drug–food check")}</h2>
          <p>Explore known food interactions and learn what to review alongside your medicines.</p>
          <span className="text-link">{t("Check food interactions")} <Icon name="arrow" size={18} /></span>
        </Link>
      </div>
    </Workspace>
  );
}
