const express = require("express");
const router = express.Router({ mergeParams: true });
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");
const analyzePrescription = require("../../lib/analyzePrescription");
router.post("/", async (req, res) => {
  try {
    const prescriptionId = positiveInt(req.params.prescriptionId, "prescriptionId");
    const { report } = await analyzePrescription(prescriptionId, req.userId);
    return res.json({ report });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
