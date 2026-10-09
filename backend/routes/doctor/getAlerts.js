const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const { prescriptionAccess } = require("../../lib/access");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = { prescription: prescriptionAccess(req) };
    if (req.query.prescriptionId !== undefined) where.prescriptionId = positiveInt(req.query.prescriptionId, "prescriptionId");
    const alerts = await prisma.alert.findMany({
      where, orderBy: { id: "desc" }, include: { prescription: true },
    });
    return res.json({ alerts });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
