const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.delete("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    await prisma.prescription.delete({ where: { id } });
    return res.json({ message: "Prescription deleted" });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
