const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");
const { prescriptionAccess } = require("../../lib/access");

router.get("/", async (req, res) => {
  try {
    const scope = prescriptionAccess(req);
    const [patients, prescriptions, medicines, unreadAlerts, pendingRecommendations] = await prisma.$transaction([
      prisma.user.findMany({ where: { OR: [{ id: req.userId }, { doctors: { some: { doctorId: req.userId } } }] }, select: { id: true, name: true, email: true, prescriptions: { select: { id: true, fileName: true, ocrResult: { select: { confidence: true, status: true } } } } } }),
      prisma.prescription.count({ where: scope }),
      prisma.medicine.count({ where: { prescriptions: { some: { prescription: scope } } } }),
      prisma.alert.count({ where: { isRead: false, prescription: scope } }),
      prisma.doctorRecommendation.count({ where: { status: "PENDING", prescription: scope } }),
    ]);
    return res.json({ users: patients.length, prescriptions, medicines, unreadAlerts, pendingRecommendations, patients });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
