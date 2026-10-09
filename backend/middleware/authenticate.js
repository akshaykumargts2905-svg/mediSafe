const { verifyToken } = require("../lib/auth");
const prisma = require("../lib/prisma");
const sendError = require("../lib/errors");

module.exports = async function authenticate(req, res, next) {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || "");
    if (!match) return res.status(401).json({ message: "Authentication required" });
    let payload;
    try {
      payload = verifyToken(match[1]);
    } catch (error) {
      if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      throw error;
    }
    // Deleted accounts must not retain access until the JWT expires.
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }, select: { id: true, role: true, language: true },
    });
    if (!user) return res.status(401).json({ message: "Invalid or expired token" });
    req.userId = user.id;
    req.userRole = user.role || "PATIENT";
    req.language = req.query.language === "en" || req.query.language === "hi" ? req.query.language
      : /^(en|hi)(-|,|;|$)/i.exec(req.get("accept-language") || "")?.[1]?.toLowerCase() || user.language || "en";
    res.set("Cache-Control", "no-store");
    return next();
  } catch (error) {
    return sendError(res, error);
  }
};
