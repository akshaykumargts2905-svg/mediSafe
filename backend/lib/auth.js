const jwt = require("jsonwebtoken");

function getAuthConfig() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32 || /your-|replace|change-me/i.test(secret)) {
    throw new Error("Set JWT_SECRET to a random secret of at least 32 bytes in .env");
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";
  if (!/^[1-9]\d*(s|m|h|d)$/.test(expiresIn)) {
    throw new Error("JWT_EXPIRES_IN must be a positive duration such as 1h or 1d");
  }
  return { secret, expiresIn };
}

function signToken(userId) {
  const { secret, expiresIn } = getAuthConfig();
  return jwt.sign({ userId }, secret, {
    algorithm: "HS256", expiresIn, issuer: "medisafe-api", audience: "medisafe-client",
  });
}

function verifyToken(token) {
  const { secret } = getAuthConfig();
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"], issuer: "medisafe-api", audience: "medisafe-client",
  });
  if (!Number.isInteger(payload.userId) || payload.userId <= 0 ||
      payload.userId > 2147483647 || !Number.isInteger(payload.exp)) {
    throw new jwt.JsonWebTokenError("Invalid token claims");
  }
  return payload;
}

module.exports = { getAuthConfig, signToken, verifyToken };
