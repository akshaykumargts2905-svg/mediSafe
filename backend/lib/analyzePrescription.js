const prisma = require("./prisma");
const saveSafetyReport = require("./safetyReport");
const { findInteractions } = require("./interactions");
const { fail } = require("./ocr");
module.exports = async function analyzePrescription(prescriptionId, userId, foodIds) {
    return prisma.$transaction(async (db) => {
      const prescription = await db.prescription.findUnique({
        where: { id: prescriptionId, userId: userId }, include: { medicines: true, ocrResult: true },
      });
      if (!prescription) {
        const error = new Error("Prescription not found");
        error.status = 404;
        throw error;
      }
      if (foodIds !== undefined && await db.food.count({ where: { id: { in: foodIds } } }) !== foodIds.length) {
        const error = new Error("One or more foods were not found");
        error.status = 404;
        throw error;
      }
      const medicineIds = prescription.medicines.map((item) => item.medicineId);
      if (!medicineIds.length) throw fail(422, "Confirm or link medicines before running analysis");
      if (prescription.ocrResult && prescription.ocrResult.status !== "CONFIRMED") throw fail(422, "Review and confirm the detected medicines before running analysis");
      const { drugInteractions, foodInteractions, alternatives } = await findInteractions(db, medicineIds, foodIds);
      // Refresh only analysis-owned alerts, preserving manually created alerts.
      await db.alert.deleteMany({
        where: { prescriptionId, type: { in: ["ANALYSIS_DRUG_DRUG", "ANALYSIS_DRUG_FOOD"] } },
      });
      const alertData = [
        ...drugInteractions.map((item) => ({
          prescriptionId, type: "ANALYSIS_DRUG_DRUG", severity: item.severity,
          title: item.medicineA.name + " + " + item.medicineB.name,
          message: item.description, messageHi: item.descriptionHi,
          risk: item.risk, riskHi: item.riskHi, recommendation: item.recommendation,
          recommendationHi: item.recommendationHi, sourceUrl: item.sourceUrl,
        })),
        ...foodInteractions.map((item) => ({
          prescriptionId, type: "ANALYSIS_DRUG_FOOD", severity: item.severity,
          title: item.medicine.name + " + " + item.food.name,
          message: item.description, messageHi: item.descriptionHi,
          risk: item.risk, riskHi: item.riskHi, recommendation: item.recommendation,
          recommendationHi: item.recommendationHi, sourceUrl: item.sourceUrl,
        })),
      ];
      if (alertData.length) await db.alert.createMany({ data: alertData });
      const report = await saveSafetyReport(db, prescriptionId);
      const alerts = await db.alert.findMany({ where: { prescriptionId }, orderBy: { id: "asc" } });
      return { prescriptionId, drugInteractions, foodInteractions, alternatives, alerts, report };
    }, { isolationLevel: "Serializable", timeout: 30000 });
};
