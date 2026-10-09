const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const { prescriptionAccess } = require("../../lib/access");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = prescriptionAccess(req);
    if (req.query.userId !== undefined) where.userId = positiveInt(req.query.userId, "userId");
    const prescriptions = await prisma.prescription.findMany({
      where, orderBy: { id: "desc" }, include: { user: { select: { id: true, name: true, email: true } }, medicines: { include: { medicine: true } }, reports: true, ocrResult: true, alerts: true },
    });
    return res.json({ prescriptions });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
