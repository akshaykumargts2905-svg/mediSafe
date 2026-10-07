const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { text: "string", language: "string" }, ["text", "language"]);
    if (!["en", "hi"].includes(data.language)) throw badRequest("language must be en or hi");
    // Placeholder: replace this with a real translation service later.
    return res.json({ originalText: data.text, translatedText: data.text, language: data.language, placeholder: true });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
