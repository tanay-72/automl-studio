import React, { useState } from "react";
import Card from "./shared/Card.jsx";
import Spinner from "./shared/Spinner.jsx";
import { Badge, ErrorBanner } from "./shared/Badge.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

export default function TargetStep() {
  const { dataset, setTargetInfo, setStep } = useAppState();
  const [selected, setSelected] = useState("");
  const [override, setOverride] = useState("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!dataset) return null;

  async function handleContinue() {
    if (!selected) {
      setError("Choose a column to predict first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.selectTarget(dataset.session_id, selected, override);
      setTargetInfo(result);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 2 of 6</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">Choose what to predict</h1>
      <p className="text-ink2 mb-6">
        <span className="font-mono text-sm bg-paper2 px-1.5 py-0.5 rounded">{dataset.filename || "your file"}</span>{" "}
        has <strong>{dataset.n_rows}</strong> rows and <strong>{dataset.n_cols}</strong> columns. Pick the
        target column — the thing you want the model to predict.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <Card title="Preview" eyebrow="First 10 rows" className="mb-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {dataset.columns.map((c) => (
                <th key={c} className="text-left font-mono font-medium text-ink2 px-3 py-2 whitespace-nowrap">
                  {c}
                  <div className="text-[10px] text-ink2/60 font-normal">{dataset.dtypes[c]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.preview.map((row, i) => (
              <tr key={i} className="border-b border-line/60">
                {dataset.columns.map((c) => (
                  <td key={c} className="px-3 py-2 whitespace-nowrap text-ink2 font-mono text-xs">
                    {row[c] === null || row[c] === undefined ? (
                      <span className="text-amber">∅</span>
                    ) : (
                      String(row[c])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Target column">
        <div className="grid sm:grid-cols-2 gap-2 mb-6">
          {dataset.columns.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(c)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                selected === c
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-line hover:border-indigo-300 text-ink"
              }`}
            >
              {c}
              <span className="block text-xs font-mono text-ink2/70">{dataset.dtypes[c]}</span>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-ink mb-2">Problem type</p>
          <div className="flex gap-2">
            {[
              ["auto", "Auto-detect"],
              ["classification", "Classification"],
              ["regression", "Regression"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOverride(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border ${
                  override === val
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-line text-ink2 hover:border-indigo-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink2 mt-2">
            "Auto-detect" looks at the target's data type and number of unique values to decide for
            you — you can always override it.
          </p>
        </div>

        {loading ? (
          <Spinner label="Cleaning data and detecting task type..." />
        ) : (
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clean data & continue →
          </button>
        )}
      </Card>
    </div>
  );
}
