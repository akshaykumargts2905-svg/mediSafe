const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { medicineId: "id", foodId: "id" }, ["medicineId", "foodId"]);
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    if (!await prisma.food.findUnique({ where: { id: data.foodId } })) {
      return res.status(404).json({ message: "food not found" });
    }
    const interaction = await prisma.drugFoodInteraction.findUnique({
      where: { medicineId_foodId: data }, include: { medicine: true, food: true },
    });
    return res.json({ found: Boolean(interaction), interaction });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
