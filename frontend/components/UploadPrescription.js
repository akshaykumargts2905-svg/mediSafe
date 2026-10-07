"use client";

import { useState } from "react";

export default function UploadPrescription() {
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    if (!file) {
      alert("Please select a prescription.");
      return;
    }

    alert("Prescription uploaded successfully!");
  };

  return (
    <div>
      <h2>Upload Prescription</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      {file && (
        <p>
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      <button onClick={handleUpload}>Upload & Check</button>
    </div>
  );
}
