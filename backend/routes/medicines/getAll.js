const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = {};
    
    const medicines = await prisma.medicine.findMany({
      where, orderBy: { id: "desc" },
    });
    return res.json({ medicines });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
