const text = (name, label, nullable = false) => ({ name, label, nullable });
export const catalogs = {
  medicines: {
    title: "Medicine catalog", path: "/api/medicines", listKey: "medicines", itemKey: "medicine",
    fields: [{ ...text("name", "Name"), required: true }, text("genericName", "Generic name", true), text("brandName", "Brand name", true), text("rxCui", "RxCUI", true), text("atcCode", "ATC code", true)],
  },
  foods: { title: "Food catalog", path: "/api/foods", listKey: "foods", itemKey: "food", fields: [{ ...text("name", "Name"), required: true }] },
  drug: {
    title: "Drug interaction catalog", path: "/api/drug-interactions", listKey: "interactions", itemKey: "interaction",
    fields: [{ name: "medicineAId", label: "First medicine", type: "number", source: "medicines", required: true }, { name: "medicineBId", label: "Second medicine", type: "number", source: "medicines", required: true },
      { ...text("severity", "Severity"), required: true }, { name: "description", label: "Description", type: "textarea", required: true }, text("recommendation", "Recommendation", true)],
  },
  food: {
    title: "Food interaction catalog", path: "/api/food-interactions", listKey: "interactions", itemKey: "interaction",
    fields: [{ name: "medicineId", label: "Medicine", type: "number", source: "medicines", required: true }, { name: "foodId", label: "Food", type: "number", source: "foods", required: true },
      { ...text("severity", "Severity"), required: true }, { name: "description", label: "Description", type: "textarea", required: true }, text("recommendation", "Recommendation", true)],
  },
};
