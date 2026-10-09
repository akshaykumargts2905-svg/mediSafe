const prisma = require("./prisma");
const { guidance, noMatch } = require("./localization");
const { fail } = require("./ocr");

async function translateText(text, source, target) {
  if (source === target) return { translatedText: text, method: "same-language" };
  for (const messages of [guidance, noMatch]) if (messages[source] === text) return { translatedText: messages[target], method: "reviewed-text" };
  const from = (name) => name + (source === "hi" ? "Hi" : "");
  const to = (name) => name + (target === "hi" ? "Hi" : "");
  // Public knowledge only: never search other patients' alerts, OCR or recommendations.
  for (const model of [prisma.drugDrugInteraction, prisma.drugFoodInteraction]) {
    const row = await model.findFirst({ where: { OR: ["description", "risk", "recommendation"].map((key) => ({ [from(key)]: text })) } });
    if (row) {
      const key = ["description", "risk", "recommendation"].find((key) => row[from(key)] === text && row[to(key)]);
      if (key) return { translatedText: row[to(key)], method: "catalog" };
    }
  }
  if (!process.env.TRANSLATION_URL) throw fail(503, "A translation is not available for this text. The original text remains available.");
  const medicines = await prisma.medicine.findMany({ select: { name: true, genericName: true, brandName: true, rxCui: true, atcCode: true, aliases: true } });
  const names = [...new Set(medicines.flatMap((item) => [item.name, item.genericName, item.brandName, item.rxCui, item.atcCode, ...item.aliases]).filter(Boolean))].sort((a, b) => b.length - a.length);
  const terms = [];
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const masked = escaped.length ? text.replace(new RegExp("(?<![\\p{L}\\p{N}])(?:" + escaped.join("|") + ")(?![\\p{L}\\p{N}])", "giu"), (term) => {
    const marker = "__MEDISAFE_TERM_" + terms.length + "__";
    terms.push({ marker, term }); return marker;
  }) : text;
  try {
    const url = new URL(process.env.TRANSLATION_URL);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid provider URL");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: masked, source, target, format: "text", ...(process.env.TRANSLATION_API_KEY ? { api_key: process.env.TRANSLATION_API_KEY } : {}) }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Provider unavailable");
    let { translatedText } = await response.json();
    if (typeof translatedText !== "string" || !translatedText.trim() || translatedText.length > 20000) throw new Error("Invalid provider response");
    for (const { marker, term } of terms) {
      if (!translatedText.includes(marker)) throw new Error("Medicine identifier was changed by provider");
      translatedText = translatedText.replaceAll(marker, term);
    }
    return { translatedText, method: "provider", machineTranslated: true };
  } catch { throw fail(503, "Translation is temporarily unavailable. The original text remains available."); }
}
module.exports = { translateText };
