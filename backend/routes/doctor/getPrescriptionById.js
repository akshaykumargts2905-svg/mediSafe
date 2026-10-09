const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const { prescriptionAccess } = require("../../lib/access");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const prescription = await prisma.prescription.findUnique({
      where: { id, ...prescriptionAccess(req) }, include: { user: { select: { id: true, name: true, email: true } }, medicines: { include: { medicine: { include: { alternatives: { include: { alternativeMedicine: true } } } } } }, ocrResult: true, alerts: true, reports: true, recommendations: { include: { medicine: true } } },
    });
    if (!prescription) return res.status(404).json({ message: "prescription not found" });
    return res.json({ prescription });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
