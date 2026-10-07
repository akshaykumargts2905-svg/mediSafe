const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const [medicines, foods, drugInteractions, foodInteractions] = await prisma.$transaction([
      prisma.medicine.findMany({ orderBy: { id: "asc" } }),
      prisma.food.findMany({ orderBy: { id: "asc" } }),
      prisma.drugDrugInteraction.findMany({ orderBy: { id: "asc" } }),
      prisma.drugFoodInteraction.findMany({ orderBy: { id: "asc" } }),
    ]);
    return res.json({ medicines, foods, drugInteractions, foodInteractions });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
