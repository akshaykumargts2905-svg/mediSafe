const prisma = require("../lib/prisma");
const medicines = require("../prisma/medicines.json");
const knowledge = require("../prisma/knowledge.json");

async function seed() {
  return prisma.$transaction(async (db) => {
    const medicineCount = await db.medicine.createMany({ data: medicines, skipDuplicates: true });
    const foodCount = await db.food.createMany({ data: knowledge.foods, skipDuplicates: true });
    const medicineRows = await db.medicine.findMany({ where: { rxCui: { in: medicines.map((item) => item.rxCui) } } });
    const foodRows = await db.food.findMany({ where: { name: { in: knowledge.foods.map((item) => item.name) } } });
    const medicine = (rxCui) => medicineRows.find((item) => item.rxCui === rxCui).id;
    const food = (name) => foodRows.find((item) => item.name === name).id;
    const drugCount = await db.drugDrugInteraction.createMany({
      data: knowledge.drugInteractions.map(({ a, b, ...data }) => {
        const [medicineAId, medicineBId] = [medicine(a), medicine(b)].sort((x, y) => x - y);
        return { ...data, medicineAId, medicineBId };
      }), skipDuplicates: true,
    });
    const foodInteractionCount = await db.drugFoodInteraction.createMany({ data: knowledge.foodInteractions.map(({ medicine: id, food: name, ...data }) => ({ ...data, medicineId: medicine(id), foodId: food(name) })), skipDuplicates: true });
    const alternativeCount = await db.alternativeMedicine.createMany({ data: knowledge.alternatives.map(({ medicine: id, alternative, ...data }) => ({ ...data, medicineId: medicine(id), alternativeMedicineId: medicine(alternative) })), skipDuplicates: true });
    return { medicinesAdded: medicineCount.count, foodsAdded: foodCount.count, drugInteractionsAdded: drugCount.count, foodInteractionsAdded: foodInteractionCount.count, alternativesAdded: alternativeCount.count };
  }, { timeout: 60000 });
}
if (require.main === module) seed().then((counts) => console.log("Knowledge catalog seed:", counts)).catch(() => { console.error("Seed failed. Check migrations and database access. No existing records were overwritten."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
module.exports = seed;
