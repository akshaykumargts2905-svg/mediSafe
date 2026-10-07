require("dotenv").config();
const express = require("express");
const prisma = require("./lib/prisma");
const authenticate = require("./middleware/authenticate");
const catalogAccess = require("./middleware/catalogAccess");
const { getAuthConfig } = require("./lib/auth");
getAuthConfig(); // Fail at startup rather than issue tokens with a missing/default secret.

const app = express();
app.use(express.json({ limit: "1mb" }));

// Each imported file defines exactly one endpoint.
app.use("/api/auth/register", require("./routes/auth/register"));
app.use("/api/auth/login", require("./routes/auth/login"));

// All remaining API routes require a verified, existing user.
app.use("/api", authenticate);
app.use(["/api/medicines", "/api/foods", "/api/drug-interactions", "/api/food-interactions"], catalogAccess);
app.use("/api/users/me", require("./routes/users/getMe"));
app.use("/api/users/me", require("./routes/users/updateMe"));
app.use("/api/users/me", require("./routes/users/deleteMe"));
app.use("/api/prescriptions", require("./routes/prescriptions/create"));
app.use("/api/prescriptions", require("./routes/prescriptions/getAll"));
app.use("/api/prescriptions/:id", require("./routes/prescriptions/getById"));
app.use("/api/prescriptions/:id", require("./routes/prescriptions/delete"));
app.use("/api/ocr/process/:prescriptionId", require("./routes/ocr/process"));
app.use("/api/ocr/:prescriptionId", require("./routes/ocr/update"));
app.use("/api/ocr/:prescriptionId", require("./routes/ocr/getByPrescription"));
app.use("/api/medicines", require("./routes/medicines/create"));
app.use("/api/medicines", require("./routes/medicines/getAll"));
app.use("/api/medicines/search", require("./routes/medicines/search"));
app.use("/api/medicines/:id", require("./routes/medicines/getById"));
app.use("/api/medicines/:id", require("./routes/medicines/update"));
app.use("/api/medicines/:id", require("./routes/medicines/delete"));
app.use("/api/prescriptions/:id/medicines", require("./routes/prescriptionMedicines/getAll"));
app.use("/api/prescriptions/:id/medicines", require("./routes/prescriptionMedicines/create"));
app.use("/api/prescriptions/:id/medicines/:medicineId", require("./routes/prescriptionMedicines/update"));
app.use("/api/prescriptions/:id/medicines/:medicineId", require("./routes/prescriptionMedicines/delete"));
app.use("/api/drug-interactions", require("./routes/drugInteractions/create"));
app.use("/api/drug-interactions", require("./routes/drugInteractions/getAll"));
app.use("/api/drug-interactions/:id", require("./routes/drugInteractions/getById"));
app.use("/api/drug-interactions/:id", require("./routes/drugInteractions/update"));
app.use("/api/drug-interactions/:id", require("./routes/drugInteractions/delete"));
app.use("/api/drug-interactions/check", require("./routes/drugInteractions/check"));
app.use("/api/foods", require("./routes/foods/create"));
app.use("/api/foods", require("./routes/foods/getAll"));
app.use("/api/foods/:id", require("./routes/foods/getById"));
app.use("/api/foods/:id", require("./routes/foods/update"));
app.use("/api/foods/:id", require("./routes/foods/delete"));
app.use("/api/food-interactions", require("./routes/foodInteractions/create"));
app.use("/api/food-interactions", require("./routes/foodInteractions/getAll"));
app.use("/api/food-interactions/:id", require("./routes/foodInteractions/getById"));
app.use("/api/food-interactions/:id", require("./routes/foodInteractions/update"));
app.use("/api/food-interactions/:id", require("./routes/foodInteractions/delete"));
app.use("/api/food-interactions/check", require("./routes/foodInteractions/check"));
app.use("/api/alerts", require("./routes/alerts/create"));
app.use("/api/alerts", require("./routes/alerts/getAll"));
app.use("/api/alerts/:id", require("./routes/alerts/getById"));
app.use("/api/alerts/:id/read", require("./routes/alerts/markRead"));
app.use("/api/alerts/:id", require("./routes/alerts/delete"));
app.use("/api/safety-reports/generate/:prescriptionId", require("./routes/safetyReports/generate"));
app.use("/api/safety-reports/:prescriptionId", require("./routes/safetyReports/getByPrescription"));
app.use("/api/safety-reports", require("./routes/safetyReports/getAll"));
app.use("/api/doctor/dashboard", require("./routes/doctor/dashboard"));
app.use("/api/doctor/prescriptions", require("./routes/doctor/getPrescriptions"));
app.use("/api/doctor/prescriptions/:id", require("./routes/doctor/getPrescriptionById"));
app.use("/api/doctor/alerts", require("./routes/doctor/getAlerts"));
app.use("/api/doctor/recommendations", require("./routes/doctor/createRecommendation"));
app.use("/api/doctor/recommendations/:prescriptionId", require("./routes/doctor/getRecommendations"));
app.use("/api/doctor/recommendations/:id", require("./routes/doctor/updateRecommendation"));
app.use("/api/languages", require("./routes/languages/getLanguages"));
app.use("/api/translate", require("./routes/translate/translate"));
app.use("/api/knowledge-graph", require("./routes/knowledgeGraph/getGraph"));
app.use("/api/knowledge-graph/medicine/:id", require("./routes/knowledgeGraph/getMedicineGraph"));
app.use("/api/analyze/:prescriptionId", require("./routes/analyze/analyzePrescription"));
app.use("/", require("./routes/health"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must contain valid JSON" });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "JSON body exceeds the 1 MB limit" });
  }
  return require("./lib/errors")(res, error);
});

// Exporting the app lets tests use an unused port without starting this listener.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  async function shutdown() {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = app;
