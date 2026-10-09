const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, idList, badRequest } = require("../../lib/validation");
const { fail } = require("../../lib/ocr");
const invalidate = require("../../lib/invalidateAnalysis");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const medicineIds = idList(req.body?.medicineIds, "medicineIds");
    const reviewVersion = positiveInt(req.body?.reviewVersion, "reviewVersion");
    if (!medicineIds.length || medicineIds.length > 50) throw badRequest("Confirm between 1 and 50 medicines");
    const result = await prisma.$transaction(async (db) => {
      const ocr = await db.oCRResult.findUnique({ where: { prescriptionId, prescription: { userId: req.userId } } });
      if (!ocr) throw fail(404, "Prescription text not found");
      if (ocr.reviewVersion !== reviewVersion) throw fail(409, "Prescription text changed. Refresh and review the latest detections.");
      if (await db.medicine.count({ where: { id: { in: medicineIds } } }) !== medicineIds.length) throw fail(404, "One or more medicines no longer exist");
      // Preserve dosage instructions for retained medicines. Only the user's confirmed list is linked.
      await db.prescriptionMedicine.deleteMany({ where: { prescriptionId, medicineId: { notIn: medicineIds } } });
      await db.prescriptionMedicine.createMany({ data: medicineIds.map((medicineId) => ({ prescriptionId, medicineId })), skipDuplicates: true });
      await invalidate(db, prescriptionId);
      const ocrResult = await db.oCRResult.update({ where: { prescriptionId }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
      const medicines = await db.prescriptionMedicine.findMany({ where: { prescriptionId }, include: { medicine: true } });
      return { ocrResult, medicines };
    }, { isolationLevel: "Serializable", timeout: 30000 });
    return res.json(result);
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
