const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"prescriptionId":"id","type":"string","severity":"string","title":"string","message":"string","language":"string","isRead":"boolean"}, ["prescriptionId","type","severity","title","message"]);
    if (!await prisma.prescription.findUnique({ where: { id: data.prescriptionId, userId: req.userId } })) {
      return res.status(404).json({ message: "prescription not found" });
    }
    if (data.type.startsWith("ANALYSIS_")) throw badRequest("ANALYSIS_ types are reserved for generated alerts");
    const alert = await prisma.alert.create({ data });
    return res.status(201).json({ alert });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
