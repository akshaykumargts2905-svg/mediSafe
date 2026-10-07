const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = {};
    
    const foods = await prisma.food.findMany({
      where, orderBy: { id: "desc" },
    });
    return res.json({ foods });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
