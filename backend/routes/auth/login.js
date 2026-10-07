const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { email: "email", password: "password" }, ["email", "password"]);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    // This MVP returns a user, without creating a token or session.
    if (!user || !user.password || user.password !== data.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const { password, ...publicUser } = user;
    return res.json({ user: publicUser });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
