const KEY = "medisafe_language";
export function getLanguage() {
  return typeof window !== "undefined" && window.localStorage.getItem(KEY) === "hi" ? "hi" : "en";
}
export function saveLanguage(language) {
  if (!["en", "hi"].includes(language) || typeof window === "undefined") return;
  window.localStorage.setItem(KEY, language);
  window.dispatchEvent(new Event("medisafe-language"));
}
export function subscribeLanguage(callback) {
  window.addEventListener("medisafe-language", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("medisafe-language", callback); window.removeEventListener("storage", callback); };
}
