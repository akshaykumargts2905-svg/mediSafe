const guidance = {
  en: "Review this result with your doctor or pharmacist. Do not start, stop or replace a medicine based on this check alone.",
  hi: "इस परिणाम पर अपने डॉक्टर या फार्मासिस्ट से बात करें। केवल इस जाँच के आधार पर कोई दवा शुरू, बंद या बदलें नहीं।",
};
const noMatch = {
  en: "No matching interaction is recorded in this limited knowledge base. This does not establish that the combination is safe.",
  hi: "इस सीमित जानकारी में इस संयोजन का कोई इंटरैक्शन दर्ज नहीं है। इसका अर्थ यह नहीं कि यह संयोजन सुरक्षित है।",
};

// Keep canonical fields for editors and identifiers; patient components use display text.
function localize(value, language) {
  if (Array.isArray(value)) return value.map((item) => localize(item, language));
  if (!value || typeof value !== "object" || value instanceof Date || Buffer.isBuffer(value)) return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, language)]));
  const display = {};
  const missing = [];
  for (const key of ["description", "recommendation", "risk", "message", "reason", "alternative"]) {
    if (typeof value[key] !== "string" || !value[key]) continue;
    display[key] = language === "hi" && value[key + "Hi"] ? value[key + "Hi"] : value[key];
    if (language === "hi" && !value[key + "Hi"]) missing.push(key);
  }
  if (value.nameHi) display.name = language === "hi" ? value.nameHi : value.name;
  if (value.overallStatus && Number.isInteger(value.totalMedicines)) {
    display.summary = language === "hi" ? `${value.totalMedicines} जुड़ी दवाएँ; ${value.totalAlerts} दर्ज अलर्ट। परिणाम केवल उपलब्ध जानकारी पर आधारित हैं।` : value.summary;
  }
  if (Object.keys(display).length) result.display = { ...display, language, untranslated: missing };
  return result;
}

function localizationMiddleware(req, res, next) {
  const json = res.json.bind(res);
  res.json = (body) => json(localize(body, req.language || "en"));
  next();
}

module.exports = { localize, localizationMiddleware, guidance, noMatch };
