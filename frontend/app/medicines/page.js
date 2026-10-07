import ApiPanel from "../../components/ApiPanel";
export default function Medicines() {
  return (
    <ApiPanel
      title="Medicine catalog"
      description="Medicine records provided by the backend."
      endpoint="/api/medicines"
    />
  );
}
