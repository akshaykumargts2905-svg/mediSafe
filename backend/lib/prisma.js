require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// Reuse one client so routes share the database connection pool.
const prisma = new PrismaClient();
module.exports = prisma;
