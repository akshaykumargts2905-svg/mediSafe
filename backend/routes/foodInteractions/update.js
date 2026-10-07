const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const data = readFields(req.body, {"medicineId":"id","foodId":"id","severity":"string","description":"string","recommendation":"string?"});
    requireChanges(data);
    if (data.medicineId !== undefined) {
      if (!await prisma.medicine.findUnique({ where: { id: data.medicineId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    }
    if (data.foodId !== undefined) {
      if (!await prisma.food.findUnique({ where: { id: data.foodId } })) {
      return res.status(404).json({ message: "food not found" });
    }
    }
    const interaction = await prisma.drugFoodInteraction.update({ where: { id }, data });
    return res.json({ interaction });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
