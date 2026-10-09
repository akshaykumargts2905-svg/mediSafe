const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"name":"string","genericName":"string?","brandName":"string?","rxCui":"string?","atcCode":"string?","strength":"string?","dosageForm":"string?","aliases":"strings"}, ["name"]);
    
    const medicine = await prisma.medicine.create({ data });
    return res.status(201).json({ medicine });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
