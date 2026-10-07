const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    if (typeof req.query.q !== "string" || !req.query.q.trim()) throw badRequest("q is required");
    const q = req.query.q.trim();
    const medicines = await prisma.medicine.findMany({
      where: { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { genericName: { contains: q, mode: "insensitive" } },
        { brandName: { contains: q, mode: "insensitive" } },
        { rxCui: { contains: q, mode: "insensitive" } },
      ] },
      orderBy: { name: "asc" },
    });
    return res.json({ medicines });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
