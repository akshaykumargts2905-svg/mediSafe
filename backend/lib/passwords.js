const bcrypt = require("bcryptjs");
const { badRequest } = require("./validation");

const SALT_ROUNDS = 12;
function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

function validateNewPassword(password) {
  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    throw badRequest("Password must contain at least 8 characters and at most 72 UTF-8 bytes");
  }
}

async function hashPassword(password) {
  validateNewPassword(password);
  return bcrypt.hash(password, SALT_ROUNDS);
}

module.exports = { SALT_ROUNDS, isBcryptHash, validateNewPassword, hashPassword };
