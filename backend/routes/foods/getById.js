const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const food = await prisma.food.findUnique({
      where: { id },
    });
    if (!food) return res.status(404).json({ message: "food not found" });
    return res.json({ food });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
