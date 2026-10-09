const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");
router.get("/", async (req, res) => {
  try {
    const doctors = await prisma.careAccess.findMany({ where: { patientId: req.userId }, include: { doctor: { select: { id: true, name: true, email: true, role: true } } } });
    return res.json({ doctors });
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
