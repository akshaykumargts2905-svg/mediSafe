const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
router.get("/", async (req, res) => {
  try {
    // x-user-id selects an MVP user; it is not authentication.
    const id = positiveInt(req.get("x-user-id"), "x-user-id");
    const user = await prisma.user.findUnique({ where: { id }, select: userFields });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
