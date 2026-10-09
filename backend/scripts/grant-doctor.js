const prisma = require("../lib/prisma");
const { readFields } = require("../lib/validation");
(async () => {
  const { email } = readFields({ email: process.argv[2] }, { email: "email" }, ["email"]);
  const user = await prisma.user.update({ where: { email }, data: { role: "DOCTOR" }, select: { id: true } });
  console.log("Doctor role granted to user ID", user.id, "Patients must explicitly share their records before this account can access them.");
})().catch(() => { console.error("Usage: npm run doctor:grant -- existing-doctor@example.com. The account must already exist."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
