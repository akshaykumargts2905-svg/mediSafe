"use client";
import { useLanguage } from "../lib/i18n";
export default function ErrorMessage({ message }) {
  const { t } = useLanguage();
  return message ? (
    <p className="feedback error" role="alert">
      {t(message)}
    </p>
  ) : null;
}
