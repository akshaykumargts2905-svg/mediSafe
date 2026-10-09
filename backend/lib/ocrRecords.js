const prisma = require("./prisma");
const { detectMedicines } = require("./normalizeMedicines");

async function prepareOcrRecord({ extractedText, confidence = null, language = "en", inputMethod = "MANUAL" }) {
  const medicines = await prisma.medicine.findMany();
  return {
    extractedText, confidence, language, inputMethod,
    candidates: detectMedicines(extractedText, medicines, confidence),
    status: "REVIEW_REQUIRED", confirmedAt: null,
  };
}

module.exports = { prepareOcrRecord };
