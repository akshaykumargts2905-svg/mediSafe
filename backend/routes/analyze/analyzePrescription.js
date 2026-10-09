const express = require("express");
const router = express.Router({ mergeParams: true });
const analyzePrescription = require("../../lib/analyzePrescription");
const { positiveInt, badRequest, idList } = require("../../lib/validation");
const sendError = require("../../lib/errors");
router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    if (req.body !== undefined && (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
      throw badRequest("Body must be a JSON object");
    }
    const foodIds = req.body?.foodIds === undefined ? undefined : idList(req.body.foodIds, "foodIds");
    const result = await analyzePrescription(prescriptionId, req.userId, foodIds);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
