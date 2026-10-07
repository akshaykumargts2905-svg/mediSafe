const express = require("express");
const router = express.Router({ mergeParams: true });
const prisma = require("../../lib/prisma");
const sendError = require("../../lib/errors");

router.get("/", async (req, res) => {
  try {
    const [users, prescriptions, medicines, unreadAlerts, pendingRecommendations] = await prisma.$transaction([
      prisma.user.count(),
      prisma.prescription.count(),
      prisma.medicine.count(),
      prisma.alert.count({ where: { isRead: false } }),
      prisma.doctorRecommendation.count({ where: { status: "PENDING" } }),
    ]);
    return res.json({ users, prescriptions, medicines, unreadAlerts, pendingRecommendations });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
