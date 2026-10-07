const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
const { hashPassword, validateNewPassword } = require("../../lib/passwords");
router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { name: "string", email: "email", password: "password" }, ["name", "email", "password"]);
    validateNewPassword(data.password);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ message: "Email is already registered" });
    data.password = await hashPassword(data.password);
    const user = await prisma.user.create({ data, select: userFields });
    return res.status(201).json({ user });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
