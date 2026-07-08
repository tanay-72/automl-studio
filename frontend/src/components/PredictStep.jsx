import React, { useEffect, useState } from "react";
import Card from "./shared/Card.jsx";
import Spinner from "./shared/Spinner.jsx";
import Button from "./shared/Button.jsx";
import { Chip } from "./shared/Chip.jsx";
import { ErrorBanner } from "./shared/Badge.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

export default function PredictStep() {
  const { dataset, targetInfo, trainResult, reset } = useAppState();
  const [schema, setSchema] = useState(null);
  const [modelKey, setModelKey] = useState(trainResult?.best_model_key || "");
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    api
      .getPredictionSchema(dataset.session_id)
      .then((res) => {
        setSchema(res);
        const initial = {};
        res.fields.forEach((f) => {
          initial[f.name] = f.type === "numeric" ? roundTo(f.mean, 2) : f.options[0] || "";
        });
        setInputs(initial);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataset]);

  async function handlePredict() {
    setPredicting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.predict(dataset.session_id, modelKey, inputs);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setPredicting(false);
    }
  }

  if (!trainResult) return null;

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 6 of 6</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-2">Make a prediction</h1>
      <p className="text-ink2 mb-6">
        Enter feature values and pick a trained model to predict{" "}
        <span className="font-mono bg-paper2 px-1.5 py-0.5 rounded">{targetInfo.target_column}</span>.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <Card>
          <Spinner label="Loading input fields..." />
        </Card>
      ) : (
        <>
          <Card title="Model" className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {schema.available_models.map((key) => {
                const display = trainResult.results.find((r) => r.model_key === key)?.display_name || key;
                return (
                  <Chip key={key} active={modelKey === key} onClick={() => setModelKey(key)}>
                    {display}
                  </Chip>
                );
              })}
            </div>
          </Card>

          <Card title="Feature values" className="mb-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {schema.fields.map((f) => (
                <label key={f.name} className="text-sm">
                  <span className="block font-medium text-ink mb-1">{f.name}</span>
                  {f.type === "numeric" ? (
                    <input
                      type="number"
                      value={inputs[f.name] ?? ""}
                      step="any"
                      onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2 border border-line rounded-lg bg-white font-mono text-sm transition-colors focus:border-indigo-400 focus:bg-white"
                    />
                  ) : (
                    <select
                      value={inputs[f.name] ?? ""}
                      onChange={(e) => setInputs((p) => ({ ...p, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2 border border-line rounded-lg bg-white font-mono text-sm transition-colors focus:border-indigo-400"
                    >
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {f.type === "numeric" && (
                    <span className="block text-[11px] text-ink2/70 font-mono mt-0.5">
                      range {f.min} – {f.max}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </Card>

          {predicting ? (
            <Spinner label="Running model..." />
          ) : (
            <Button onClick={handlePredict}>Predict →</Button>
          )}

          {result && (
            <Card title="Prediction" className="mt-6 animate-fade-in-up" hover>
              <p className="font-display text-3xl text-ink mb-3">
                {targetInfo.target_column} ={" "}
                <span className="text-gradient font-bold">{formatPrediction(result.prediction)}</span>
              </p>
              {result.probability && (
                <div className="space-y-1.5">
                  {Object.entries(result.probability)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, p]) => (
                      <div key={cls} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-ink2 w-24 truncate">{cls}</span>
                        <div className="flex-1 h-2.5 bg-paper2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-gradient rounded-full transition-all duration-500"
                            style={{ width: `${p * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-ink2 w-12 text-right">{(p * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          )}

          <div className="mt-8 pt-6 border-t border-line">
            <Button variant="ghost" size="sm" onClick={reset} className="!px-0 underline underline-offset-2">
              Start over with a new dataset
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function roundTo(n, d) {
  if (n === undefined || n === null) return "";
  return Math.round(n * 10 ** d) / 10 ** d;
}

function formatPrediction(p) {
  if (typeof p === "number") return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return p;
}
