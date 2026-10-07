export default function MedicineCard({ name, dosage, frequency }) {
  return (
    <div>
      <h3>{name}</h3>

      <p>Dosage: {dosage}</p>
      <p>Frequency: {frequency}</p>
    </div>
  );
}
