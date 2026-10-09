// A changed medicine list makes previous generated findings stale.
module.exports = async function invalidateAnalysis(db, prescriptionId) {
  await db.alert.deleteMany({ where: { prescriptionId, type: { in: ["ANALYSIS_DRUG_DRUG", "ANALYSIS_DRUG_FOOD"] } } });
  await db.safetyReport.deleteMany({ where: { prescriptionId } });
};
