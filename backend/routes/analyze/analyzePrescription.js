const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, badRequest, idList } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const saveSafetyReport = require("../../lib/safetyReport");
router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    if (req.body !== undefined && (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
      throw badRequest("Body must be a JSON object");
    }
    const foodIds = req.body?.foodIds === undefined ? undefined : idList(req.body.foodIds, "foodIds");
    const result = await prisma.$transaction(async (db) => {
      const prescription = await db.prescription.findUnique({
        where: { id: prescriptionId, userId: req.userId }, include: { medicines: true },
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
      const drugInteractions = await db.drugDrugInteraction.findMany({
        where: { medicineAId: { in: medicineIds }, medicineBId: { in: medicineIds } },
        include: { medicineA: true, medicineB: true },
      });
      // Without foodIds, show all known food cautions for these medicines.
      // The schema does not record which foods a patient actually consumes.
      const foodInteractions = await db.drugFoodInteraction.findMany({
        where: {
          medicineId: { in: medicineIds },
          ...(foodIds === undefined ? {} : { foodId: { in: foodIds } }),
        },
        include: { medicine: true, food: true },
      });
      // Refresh only analysis-owned alerts, preserving manually created alerts.
      await db.alert.deleteMany({
        where: { prescriptionId, type: { in: ["ANALYSIS_DRUG_DRUG", "ANALYSIS_DRUG_FOOD"] } },
      });
      const alertData = [
        ...drugInteractions.map((item) => ({
          prescriptionId, type: "ANALYSIS_DRUG_DRUG", severity: item.severity,
          title: item.medicineA.name + " + " + item.medicineB.name,
          message: item.description + (item.recommendation ? " " + item.recommendation : ""),
        })),
        ...foodInteractions.map((item) => ({
          prescriptionId, type: "ANALYSIS_DRUG_FOOD", severity: item.severity,
          title: item.medicine.name + " + " + item.food.name,
          message: item.description + (item.recommendation ? " " + item.recommendation : ""),
        })),
      ];
      if (alertData.length) await db.alert.createMany({ data: alertData });
      const report = await saveSafetyReport(db, prescriptionId);
      const alerts = await db.alert.findMany({ where: { prescriptionId }, orderBy: { id: "asc" } });
      return { prescriptionId, drugInteractions, foodInteractions, alerts, report };
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
