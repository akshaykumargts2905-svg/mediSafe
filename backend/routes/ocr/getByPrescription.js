const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const ocrResult = await prisma.oCRResult.findUnique({ where: { prescriptionId, prescription: { userId: req.userId } } });
    if (!ocrResult) return res.status(404).json({ message: "OCR result not found" });
    return res.json({ ocrResult });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
