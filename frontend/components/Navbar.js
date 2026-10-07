export default function Navbar() {
  return (
    <nav>
      <h2>MediSafe</h2>

      <div>
        <a href="/dashboard">Dashboard</a>{" "}
        <a href="/prescription">Prescription</a> <a href="/results">Results</a>{" "}
        <a href="/doctor">Doctor</a>
      </div>
    </nav>
  );
}
