const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const data = readFields(req.body, {"extractedText":"string","confidence":"float?","language":"string?","status":"string"}, ["extractedText"]);
    requireChanges(data);
    if (data.confidence !== undefined && data.confidence !== null && (data.confidence < 0 || data.confidence > 1)) {
      throw badRequest("confidence must be between 0 and 1");
    }
    if (!await prisma.prescription.findUnique({ where: { id: prescriptionId, userId: req.userId } })) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    // Placeholder: the caller supplies extracted text; no OCR engine is used.
    const ocrResult = await prisma.$transaction(async (db) => {
      const result = await db.oCRResult.upsert({
        where: { prescriptionId },
        create: { ...data, prescriptionId, status: data.status || "COMPLETED" },
        update: { ...data, status: data.status || "COMPLETED" },
      });
      if (data.extractedText !== undefined) {
        await db.prescription.update({ where: { id: prescriptionId }, data: { ocrText: data.extractedText } });
      }
      return result;
    });
    return res.json({ message: "OCR result saved", ocrResult });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
