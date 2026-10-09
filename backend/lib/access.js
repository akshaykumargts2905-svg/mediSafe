function prescriptionAccess(req) {
  return { OR: [
    { userId: req.userId },
    ...(req.userRole === "DOCTOR" ? [{ user: { doctors: { some: { doctorId: req.userId } } } }] : []),
  ] };
}

function requireDoctor(req, res, next) {
  if (req.userRole !== "DOCTOR") return res.status(403).json({ message: "A verified doctor account is required" });
  return next();
}

module.exports = { prescriptionAccess, requireDoctor };
