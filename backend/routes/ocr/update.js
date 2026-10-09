const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const { prepareOcrRecord } = require("../../lib/ocrRecords");
const invalidate = require("../../lib/invalidateAnalysis");

router.put("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const data = readFields(req.body, {"extractedText":"string","confidence":"float?","language":"language","status":"string"}, ["extractedText"]);
    requireChanges(data);
    if (data.confidence !== undefined && data.confidence !== null && (data.confidence < 0 || data.confidence > 1)) {
      throw badRequest("confidence must be between 0 and 1");
    }
    const prescription = await prisma.prescription.findUnique({ where: { id: prescriptionId, userId: req.userId }, include: { ocrResult: true } });
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    const prepared = await prepareOcrRecord({ extractedText: data.extractedText, language: data.language || req.language, inputMethod: prescription.ocrResult?.inputMethod || "MANUAL", confidence: prescription.ocrResult?.confidence ?? null });
    const ocrResult = await prisma.$transaction(async (db) => {
      const result = await db.oCRResult.update({ where: { prescriptionId }, data: { ...prepared, reviewVersion: { increment: 1 } } });
      if (data.extractedText !== undefined) {
        await db.prescription.update({ where: { id: prescriptionId }, data: { ocrText: data.extractedText } });
      }
      await invalidate(db, prescriptionId);
      return result;
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json({ message: "OCR result saved", ocrResult });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
