const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"name":"string","nameHi":"string?"}, ["name"]);
    
    const food = await prisma.food.create({ data });
    return res.status(201).json({ food });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
