const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const report = await prisma.safetyReport.findFirst({ where: { prescriptionId }, orderBy: { id: "desc" } });
    if (!report) return res.status(404).json({ message: "Safety report not found" });
    return res.json({ report });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
