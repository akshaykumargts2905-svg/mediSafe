import Link from "next/link";
import StatusBadge from "./StatusBadge";
export default function PrescriptionCard({ prescription }) {
  return (
    <Link className="row-card" href={`/prescriptions/${prescription.id}`}>
      <span>
        <b>{prescription.fileName}</b>
        <p>
          {prescription.createdAt
            ? new Date(prescription.createdAt).toLocaleDateString()
            : `Prescription #${prescription.id}`}
        </p>
      </span>
      <StatusBadge status={prescription.status || "RECEIVED"} />
    </Link>
  );
}
