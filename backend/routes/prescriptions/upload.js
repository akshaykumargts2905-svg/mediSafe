const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { upload, validateImage, recognizeImage } = require("../../lib/ocr");
const { prepareOcrRecord } = require("../../lib/ocrRecords");
const sendError = require("../../lib/errors");

router.post("/", upload, async (req, res) => {
  try {
    const image = await validateImage(req.file);
    const result = await recognizeImage(image, req.body.language || req.language);
    const ocr = await prepareOcrRecord({ ...result, inputMethod: "IMAGE" });
    const fileName = req.file.originalname.replace(/^.*[\\/]/, "").replace(/[\x00-\x1F]/g, "").slice(0, 200) || "prescription.png";
    const prescription = await prisma.prescription.create({
      data: { userId: req.userId, fileName, ocrText: ocr.extractedText,
        image: { create: { bytes: image, mimeType: "image/png" } }, ocrResult: { create: ocr } },
      include: { ocrResult: true },
    });
    return res.status(201).json({ prescription });
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
