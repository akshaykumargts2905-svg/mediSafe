const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");
const userFields = require("../../lib/userFields");
const { canEditCatalog } = require("../../middleware/catalogAccess");
router.get("/", async (req, res) => {
  try {
    const id = req.userId;
    const user = await prisma.user.findUnique({ where: { id }, select: userFields });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user, permissions: { catalogEditor: canEditCatalog(user.id) } });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
