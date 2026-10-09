const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const invalidate = require("../../lib/invalidateAnalysis");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.id);
    const medicineId = positiveInt(req.params.medicineId, "medicineId");
    const data = readFields(req.body, { dosage: "string?", frequency: "string?", duration: "string?" });
    requireChanges(data);
    const prescriptionMedicine = await prisma.$transaction(async (db) => {
      const row = await db.prescriptionMedicine.update({
      where: { prescriptionId_medicineId: { prescriptionId, medicineId }, prescription: { userId: req.userId } }, data,
    });
      await invalidate(db, prescriptionId);
      return row;
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json({ prescriptionMedicine });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
