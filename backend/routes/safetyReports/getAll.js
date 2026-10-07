const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = { prescription: { userId: req.userId } };
    if (req.query.prescriptionId !== undefined) where.prescriptionId = positiveInt(req.query.prescriptionId, "prescriptionId");
    const reports = await prisma.safetyReport.findMany({
      where, orderBy: { id: "desc" },
    });
    return res.json({ reports });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
