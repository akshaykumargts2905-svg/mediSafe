const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.put("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const data = readFields(req.body, {"name":"string","nameHi":"string?"});
    requireChanges(data);
    
    const food = await prisma.food.update({ where: { id }, data });
    return res.json({ food });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
