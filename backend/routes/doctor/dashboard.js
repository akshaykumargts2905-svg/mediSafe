const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const [users, prescriptions, medicines, unreadAlerts, pendingRecommendations] = await prisma.$transaction([
      prisma.user.count({ where: { id: req.userId } }),
      prisma.prescription.count({ where: { userId: req.userId } }),
      prisma.medicine.count({ where: { prescriptions: { some: { prescription: { userId: req.userId } } } } }),
      prisma.alert.count({ where: { isRead: false, prescription: { userId: req.userId } } }),
      prisma.doctorRecommendation.count({ where: { status: "PENDING", prescription: { userId: req.userId } } }),
    ]);
    return res.json({ users, prescriptions, medicines, unreadAlerts, pendingRecommendations });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
