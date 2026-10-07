const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.patch("/", async (req, res) => {
  try {
    const id = positiveInt(req.params.id);
    const alert = await prisma.alert.update({ where: { id }, data: { isRead: true } });
    return res.json({ alert });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
