const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { drugInclude, foodInclude } = require("../../lib/interactions");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const [medicines, foods, drugInteractions, foodInteractions, alternatives] = await prisma.$transaction([
      prisma.medicine.findMany({ orderBy: { id: "asc" } }),
      prisma.food.findMany({ orderBy: { id: "asc" } }),
      prisma.drugDrugInteraction.findMany({ include: drugInclude, orderBy: { id: "asc" } }),
      prisma.drugFoodInteraction.findMany({ include: foodInclude, orderBy: { id: "asc" } }),
      prisma.alternativeMedicine.findMany({ include: { medicine: true, alternativeMedicine: true } }),
    ]);
    return res.json({ medicines, foods, drugInteractions, foodInteractions, alternatives });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
