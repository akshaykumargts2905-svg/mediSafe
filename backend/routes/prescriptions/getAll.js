const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = { userId: req.userId };
    if (req.query.userId !== undefined && positiveInt(req.query.userId, "userId") !== req.userId) {
      return res.status(403).json({ message: "Cannot access another user's prescriptions" });
    }
    const prescriptions = await prisma.prescription.findMany({
      where, orderBy: { id: "desc" }, include: { medicines: { include: { medicine: true } } },
    });
    return res.json({ prescriptions });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
