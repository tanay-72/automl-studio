import React, { useRef, useState } from "react";
import Card from "./shared/Card.jsx";
import Spinner from "./shared/Spinner.jsx";
import { ErrorBanner } from "./shared/Badge.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

export default function UploadStep() {
  const { setDataset, setStep } = useAppState();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadDataset(file);
      setDataset(result);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 1 of 6</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">Upload your dataset</h1>
      <p className="text-ink2 mb-6">
        Drop in a CSV file. We'll detect column types, then walk you through cleaning, exploring, and
        modeling it — no setup required.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <Card>
        {loading ? (
          <Spinner label="Reading file and inferring column types..." />
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed px-6 py-14 cursor-pointer transition-colors ${
              dragOver ? "border-indigo-600 bg-indigo-50" : "border-line hover:border-indigo-300"
            }`}
          >
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600 font-mono text-sm">
              .csv
            </div>
            <p className="font-medium text-ink">Drag a CSV file here, or click to browse</p>
            <p className="text-sm text-ink2 mt-1">Up to 50MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
