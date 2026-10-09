const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const { prescriptionAccess } = require("../../lib/access");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.id);
    const image = await prisma.prescriptionImage.findUnique({ where: { prescriptionId, prescription: prescriptionAccess(req) } });
    if (!image) return res.status(404).json({ message: "Prescription image not found" });
    res.set({ "Content-Type": image.mimeType, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" });
    return res.send(Buffer.from(image.bytes));
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
