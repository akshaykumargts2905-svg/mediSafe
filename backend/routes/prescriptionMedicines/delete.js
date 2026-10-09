const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const invalidate = require("../../lib/invalidateAnalysis");
const sendError = require("../../lib/errors");

router.delete("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.id);
    const medicineId = positiveInt(req.params.medicineId, "medicineId");
    await prisma.$transaction(async (db) => {
    await db.prescriptionMedicine.delete({
      where: { prescriptionId_medicineId: { prescriptionId, medicineId }, prescription: { userId: req.userId } },
    });
    await invalidate(db, prescriptionId);
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json({ message: "Medicine removed from prescription" });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
