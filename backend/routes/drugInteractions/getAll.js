const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const where = {};
    
    const interactions = await prisma.drugDrugInteraction.findMany({
      where, orderBy: { id: "desc" }, include: { medicineA: true, medicineB: true },
    });
    return res.json({ interactions });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
