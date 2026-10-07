const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { medicineAId: "id", medicineBId: "id" }, ["medicineAId", "medicineBId"]);
    if (data.medicineAId === data.medicineBId) throw badRequest("Choose two different medicines");
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineAId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineBId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    // Store each undirected pair in a consistent order.
    [data.medicineAId, data.medicineBId] = [data.medicineAId, data.medicineBId].sort((a, b) => a - b);
    const interaction = await prisma.drugDrugInteraction.findFirst({
      where: { OR: [
        { medicineAId: data.medicineAId, medicineBId: data.medicineBId },
        { medicineAId: data.medicineBId, medicineBId: data.medicineAId },
      ] },
      include: { medicineA: true, medicineB: true },
    });
    return res.json({ found: Boolean(interaction), interaction });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
