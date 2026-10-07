"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Workspace from "../../../components/Workspace";
import { api, json, currentUserId } from "../../../lib/api";
export default function Upload() {
  const [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [text, setText] = useState("");
  const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!currentUserId()) {
      setError(
        "Log in first so the prescription can be linked to your account.",
      );
      return;
    }
    if (!file) return;
    setBusy(true);
    try {
      const r = await api(
        "/api/prescriptions",
        json("POST", {
          userId: Number(currentUserId()),
          fileName: file.name,
          fileUrl: "",
          ocrText: text || undefined,
        }),
      );
      const id = r.prescription.id;
      if (text)
        await api(
          `/api/ocr/process/${id}`,
          json("POST", { extractedText: text, status: "COMPLETED" }),
        );
      router.push(`/prescriptions/${id}`);
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Workspace
      title="Add a prescription"
      description="Select a prescription file and optionally enter its text for the backend OCR record."
    >
      <form className="panel" onSubmit={submit}>
        <label className="eyebrow" htmlFor="file">
          PRESCRIPTION FILE
        </label>
        <input
          id="file"
          className="form-control"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0])}
        />
        {file && (
          <p className="feedback">
            Selected: {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
        <label className="eyebrow" htmlFor="ocr-text">
          EXTRACTED TEXT (OPTIONAL)
        </label>
        <textarea
          id="ocr-text"
          className="form-control"
          rows="5"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The current backend does not run OCR. Enter text from the prescription here if available."
        />
        {error && <p className="feedback error">{error}</p>}
        <button className="button" disabled={busy}>
          {busy ? "Saving…" : "Save prescription"}
        </button>
      </form>
    </Workspace>
  );
}
