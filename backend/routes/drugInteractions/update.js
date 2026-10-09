const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const data = readFields(req.body, {"medicineAId":"id","medicineBId":"id","severity":"severity","description":"string","recommendation":"string?","risk":"string?","descriptionHi":"string?","recommendationHi":"string?","riskHi":"string?","sourceUrl":"url?"});
    requireChanges(data);
    const existing = await prisma.drugDrugInteraction.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Interaction not found" });
    data.medicineAId = data.medicineAId ?? existing.medicineAId;
    data.medicineBId = data.medicineBId ?? existing.medicineBId;
    if (data.medicineAId === data.medicineBId) throw badRequest("Choose two different medicines");
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineAId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineBId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    // Store each undirected pair in a consistent order.
    [data.medicineAId, data.medicineBId] = [data.medicineAId, data.medicineBId].sort((a, b) => a - b);
    const interaction = await prisma.drugDrugInteraction.update({ where: { id }, data });
    return res.json({ interaction });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
