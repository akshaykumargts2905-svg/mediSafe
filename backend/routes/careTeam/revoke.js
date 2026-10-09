const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { positiveInt } = require("../../lib/validation");
const sendError = require("../../lib/errors");
router.delete("/", async (req, res) => {
  try {
    const doctorId = positiveInt(req.params.doctorId, "doctorId");
    await prisma.careAccess.delete({ where: { patientId_doctorId: { patientId: req.userId, doctorId } } });
    return res.json({ message: "Doctor access revoked" });
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
