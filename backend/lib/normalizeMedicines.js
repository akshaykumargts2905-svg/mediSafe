const normalize = (text) => String(text || "").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}

// Suggestions are deliberately separate from PrescriptionMedicine records.
function detectMedicines(text, medicines, ocrConfidence = null) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 200);
  const matches = new Map();
  const unmatchedLines = [];
  for (const line of lines) {
    const normalized = normalize(line);
    const tokens = normalized.split(" ").filter((token) => token.length >= 5 && token.length <= 40);
    let found = false;
    for (const medicine of medicines) {
      const aliases = [...new Set([medicine.name, ...medicine.name.split(/[()/]/), medicine.genericName, medicine.brandName, ...(medicine.aliases || [])].map(normalize).filter(Boolean))];
      let score = 0;
      for (const alias of aliases) {
        if ((" " + normalized + " ").includes(" " + alias + " ")) { score = 1; break; }
        // A single character error can suggest a candidate, never confirm it.
        if (alias.length >= 5 && alias.length <= 40 && !alias.includes(" ")) {
          if (tokens.some((token) => Math.abs(token.length - alias.length) <= 1 && distance(token, alias) <= 1)) score = Math.max(score, 0.8);
        }
      }
      if (!score) continue;
      found = true;
      const match = {
        medicineId: medicine.id, name: medicine.name, rxCui: medicine.rxCui,
        matchedText: line, matchType: score === 1 ? "EXACT" : "POSSIBLE",
        confidence: ocrConfidence === null ? score : Math.min(score, ocrConfidence),
        detectedStrength: /\b\d+(?:\.\d+)?\s*(?:mcg|mg|g|ml)\b/i.exec(line)?.[0] || null,
      };
      if (!matches.has(medicine.id) || matches.get(medicine.id).confidence < match.confidence) matches.set(medicine.id, match);
    }
    if (!found) unmatchedLines.push(line);
  }
  return { matches: [...matches.values()], unmatchedLines };
}

module.exports = { normalize, detectMedicines };
