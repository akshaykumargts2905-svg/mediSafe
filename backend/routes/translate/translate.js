const express = require("express");
const router = express.Router({ mergeParams: true });
const { readFields, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const { translateText } = require("../../lib/translation");

router.post("/", async (req, res) => {
  try {
    const data = readFields(req.body, { text: "string", language: "language", source: "language" }, ["text", "language"]);
    if (data.text.length > 4000) throw badRequest("Text must contain at most 4000 characters");
    const result = await translateText(data.text, data.source || "en", data.language);
    return res.json({ originalText: data.text, ...result, language: data.language });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
