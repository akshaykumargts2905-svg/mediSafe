const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const interaction = await prisma.drugFoodInteraction.findUnique({
      where: { id }, include: { medicine: true, food: true },
    });
    if (!interaction) return res.status(404).json({ message: "interaction not found" });
    return res.json({ interaction });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
