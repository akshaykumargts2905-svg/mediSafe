const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const { readFields, badRequest } = require("../../lib/validation");
const sendError = require("../../lib/errors");
router.post("/", async (req, res) => {
  try {
    const { email } = readFields(req.body, { email: "email" }, ["email"]);
    const doctor = await prisma.user.findUnique({ where: { email, role: "DOCTOR" }, select: { id: true, name: true } });
    if (!doctor) return res.status(404).json({ message: "A verified doctor with that email was not found" });
    if (doctor.id === req.userId) throw badRequest("Choose another doctor to share your records with");
    const access = await prisma.careAccess.upsert({ where: { patientId_doctorId: { patientId: req.userId, doctorId: doctor.id } }, create: { patientId: req.userId, doctorId: doctor.id }, update: {} });
    return res.status(201).json({ access, doctor });
  } catch (error) { return sendError(res, error); }
});
module.exports = router;
