const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
router.delete("/", async (req, res) => {
  try {
    // x-user-id selects an MVP user; it is not authentication.
    const id = positiveInt(req.get("x-user-id"), "x-user-id");
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User deleted" });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
