const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const saveSafetyReport = require("../../lib/safetyReport");
router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const report = await prisma.$transaction(async (db) => {
      if (!await db.prescription.findUnique({ where: { id: prescriptionId, userId: req.userId } })) {
        const error = new Error("Prescription not found");
        error.status = 404;
        throw error;
      }
      return saveSafetyReport(db, prescriptionId);
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json({ report });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
