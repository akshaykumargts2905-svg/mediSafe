const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"userId":"id","fileName":"string","fileUrl":"string?","ocrText":"string?"}, ["fileName"]);
    if (data.userId !== undefined && data.userId !== req.userId) {
      return res.status(403).json({ message: "Cannot create prescriptions for another user" });
    }
    data.userId = req.userId;
    const prescription = await prisma.prescription.create({ data });
    return res.status(201).json({ prescription });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
