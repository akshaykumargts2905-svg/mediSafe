const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const alert = await prisma.alert.findUnique({
      where: { id },
    });
    if (!alert) return res.status(404).json({ message: "alert not found" });
    return res.json({ alert });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
