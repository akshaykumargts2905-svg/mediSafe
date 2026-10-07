// The schema permits report history. Refresh the latest report if one exists.
async function saveSafetyReport(db, prescriptionId) {
  const totalMedicines = await db.prescriptionMedicine.count({ where: { prescriptionId } });
  const alerts = await db.alert.findMany({ where: { prescriptionId } });
  const highRiskCount = alerts.filter((alert) =>
    ["HIGH", "SEVERE", "CRITICAL", "MAJOR"].includes(alert.severity.toUpperCase())
  ).length;
  const data = {
    prescriptionId,
    totalMedicines,
    totalAlerts: alerts.length,
    highRiskCount,
    overallStatus: highRiskCount ? "HIGH_RISK" : alerts.length ? "REVIEW_REQUIRED" : "NO_KNOWN_ALERTS",
    summary: totalMedicines + " linked medicines; " + alerts.length +
      " stored alerts. Results reflect database records only.",
  };
  const existing = await db.safetyReport.findFirst({
    where: { prescriptionId },
    orderBy: { id: "desc" },
  });
  if (existing) {
    return db.safetyReport.update({ where: { id: existing.id }, data });
  }
  return db.safetyReport.create({ data });
}

module.exports = saveSafetyReport;
