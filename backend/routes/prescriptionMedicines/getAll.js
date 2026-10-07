const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.id);
    if (!await prisma.prescription.findUnique({ where: { id: prescriptionId } })) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    const medicines = await prisma.prescriptionMedicine.findMany({
      where: { prescriptionId }, include: { medicine: true }, orderBy: { id: "asc" },
    });
    return res.json({ medicines });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
