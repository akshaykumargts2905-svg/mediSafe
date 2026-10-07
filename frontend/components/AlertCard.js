export default function AlertCard({ severity, title, message }) {
  return (
    <div>
      <h3>⚠️ {title}</h3>

      <p>
        <strong>Severity:</strong> {severity}
      </p>

      <p>{message}</p>
    </div>
  );
}
