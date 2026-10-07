const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
router.delete("/", async (req, res) => {
  try {
    const id = req.userId;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User deleted" });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
