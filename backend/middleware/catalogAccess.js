// The schema has no catalog owner/role. Only explicitly trusted IDs may edit shared data.
module.exports = function catalogAccess(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) ||
      (req.method === "POST" && /^\/check\/?$/i.test(req.path))) {
    return next();
  }
  const editors = (process.env.CATALOG_EDITOR_IDS || "").split(",").map((id) => id.trim());
  if (!editors.includes(String(req.userId))) {
    return res.status(403).json({ message: "Shared catalog editing requires permission" });
  }
  return next();
};
