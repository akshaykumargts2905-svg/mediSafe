const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../lib/prisma");
const sendError = require("../lib/errors");

router.get("/", async (req, res) => {
  try {
    return res.json({ message: "MediSafe API is running" });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
