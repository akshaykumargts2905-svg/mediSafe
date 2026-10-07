export default function Loading({ label = "Loading…" }) {
  return (
    <p className="feedback" role="status">
      {label}
    </p>
  );
}
