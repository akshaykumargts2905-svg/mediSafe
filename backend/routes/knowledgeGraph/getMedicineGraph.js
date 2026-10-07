const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: {
        interactionsAsA: { include: { medicineB: true } },
        interactionsAsB: { include: { medicineA: true } },
        foodInteractions: { include: { food: true } },
      },
    });
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    return res.json({ medicine });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
