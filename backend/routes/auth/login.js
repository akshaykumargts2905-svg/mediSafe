const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const bcrypt = require("bcryptjs");
const { signToken } = require("../../lib/auth");
const { isBcryptHash, SALT_ROUNDS } = require("../../lib/passwords");
const userFields = require("../../lib/userFields");
// Keep a bcrypt comparison even for unknown accounts.
const dummyHash = bcrypt.hash("not-a-user-password", SALT_ROUNDS);

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { email: "email", password: "password" }, ["email", "password"]);
    if (Buffer.byteLength(data.password, "utf8") > 72) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const user = await prisma.user.findUnique({
      where: { email: data.email }, select: { ...userFields, password: true },
    });
    const hasHash = isBcryptHash(user?.password);
    const matches = await bcrypt.compare(data.password, hasHash ? user.password : await dummyHash);
    if (!user || !hasHash || !matches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { password, ...publicUser } = user;
    const token = signToken(user.id);
    res.set("Cache-Control", "no-store");
    return res.json({ user: publicUser, token });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
