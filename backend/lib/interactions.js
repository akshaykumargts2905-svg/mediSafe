const medicineWithAlternatives = { include: { alternatives: { include: { alternativeMedicine: true } } } };
const drugInclude = { medicineA: medicineWithAlternatives, medicineB: medicineWithAlternatives };
const foodInclude = { medicine: medicineWithAlternatives, food: true };

async function findInteractions(db, medicineIds, foodIds) {
  const [drugInteractions, foodInteractions, alternatives] = await Promise.all([
    db.drugDrugInteraction.findMany({ where: { medicineAId: { in: medicineIds }, medicineBId: { in: medicineIds } }, include: drugInclude }),
    db.drugFoodInteraction.findMany({ where: { medicineId: { in: medicineIds }, ...(foodIds === undefined ? {} : { foodId: { in: foodIds } }) }, include: foodInclude }),
    db.alternativeMedicine.findMany({ where: { medicineId: { in: medicineIds } }, include: { medicine: true, alternativeMedicine: true } }),
  ]);
  return { drugInteractions, foodInteractions, alternatives };
}

module.exports = { findInteractions, drugInclude, foodInclude };
