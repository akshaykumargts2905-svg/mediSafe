const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields, requireChanges } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
const { hashPassword } = require("../../lib/passwords");
router.put("/", async (req, res) => {
  try {
    const id = req.userId;
    const data = readFields(req.body, { name: "string", email: "email", password: "password" });
    requireChanges(data);
    if (data.password !== undefined) data.password = await hashPassword(data.password);
    const user = await prisma.user.update({ where: { id }, data, select: userFields });
    return res.json({ user });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
