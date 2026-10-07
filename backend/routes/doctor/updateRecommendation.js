const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const data = readFields(req.body, {"alternative":"string?","reason":"string","status":"string"});
    requireChanges(data);
    
    const recommendation = await prisma.doctorRecommendation.update({ where: { id }, data });
    return res.json({ recommendation });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
