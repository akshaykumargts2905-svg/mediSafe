export default function ErrorMessage({ message }) {
  return message ? (
    <p className="feedback error" role="alert">
      {message}
    </p>
  ) : null;
}
