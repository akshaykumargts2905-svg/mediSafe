require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { isBcryptHash, SALT_ROUNDS } = require("../lib/passwords");

// One-time data upgrade, not a schema migration. Existing bcrypt hashes stay byte-for-byte unchanged.
async function hashExistingPasswords() {
  let updated = 0;
  let skipped = 0;
  let requiresReset = 0;
  let cursor = 0;
  while (true) {
    const users = await prisma.user.findMany({
      where: { id: { gt: cursor }, password: { not: null } },
      orderBy: { id: "asc" }, take: 100, select: { id: true, password: true },
    });
    if (!users.length) break;
    for (const user of users) {
      cursor = user.id;
      if (isBcryptHash(user.password)) {
        skipped++;
        continue;
      }
      // Preserve other recognizable hash formats; those accounts need a password reset.
      if (!user.password || Buffer.byteLength(user.password, "utf8") > 72 ||
          /^(\$|scrypt[:$]|pbkdf2[:_$]|[a-f0-9]{32,128}$)/i.test(user.password)) {
        requiresReset++;
        continue;
      }
      const password = await bcrypt.hash(user.password, SALT_ROUNDS);
      // Do not overwrite a password changed concurrently.
      const result = await prisma.user.updateMany({
        where: { id: user.id, password: user.password }, data: { password },
      });
      updated += result.count;
    }
  }
  return { updated, skipped, requiresReset };
}

if (require.main === module) {
  hashExistingPasswords()
    .then((result) => {
      console.log("Password upgrade counts:", result);
      if (result.requiresReset) process.exitCode = 1;
    })
    .catch(() => {
      console.error("Password upgrade failed. Check the database connection; no credentials were logged.");
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = hashExistingPasswords;
