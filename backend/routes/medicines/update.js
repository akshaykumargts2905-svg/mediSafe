const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const data = readFields(req.body, {"name":"string","genericName":"string?","brandName":"string?","rxCui":"string?","atcCode":"string?"});
    requireChanges(data);
    
    const medicine = await prisma.medicine.update({ where: { id }, data });
    return res.json({ medicine });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
