const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, {"userId":"id","fileName":"string","fileUrl":"string?","ocrText":"string?"}, ["userId","fileName"]);
    if (!await prisma.user.findUnique({ where: { id: data.userId } })) {
      return res.status(404).json({ message: "user not found" });
    }
    const prescription = await prisma.prescription.create({ data });
    return res.status(201).json({ prescription });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
