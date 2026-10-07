const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"prescriptionId":"id","medicineId":"id","alternative":"string?","reason":"string","status":"string"}, ["prescriptionId","medicineId","reason"]);
    if (!await prisma.prescription.findUnique({ where: { id: data.prescriptionId, userId: req.userId } })) {
      return res.status(404).json({ message: "prescription not found" });
    }
    if (!await prisma.medicine.findUnique({ where: { id: data.medicineId } })) {
      return res.status(404).json({ message: "medicine not found" });
    }
    const recommendation = await prisma.doctorRecommendation.create({ data });
    return res.status(201).json({ recommendation });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
