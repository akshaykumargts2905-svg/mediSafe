const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt, readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
router.put("/", async (req, res) => {
  try {
    // x-user-id selects an MVP user; it is not authentication.
    const id = positiveInt(req.get("x-user-id"), "x-user-id");
    const data = readFields(req.body, { name: "string", email: "email", password: "password" });
    requireChanges(data);
    const user = await prisma.user.update({ where: { id }, data, select: userFields });
    return res.json({ user });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
