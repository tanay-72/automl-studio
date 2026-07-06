import React, { useEffect, useState } from "react";
import Card from "./shared/Card.jsx";
import Spinner from "./shared/Spinner.jsx";
import { ErrorBanner } from "./shared/Badge.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

export default function TrainStep() {
  const { dataset, targetInfo, setTrainResult, setStep } = useAppState();
  const [algorithms, setAlgorithms] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [tune, setTune] = useState(false);
  const [params, setParams] = useState({}); // model_key -> { param: value }
  const [loadingList, setLoadingList] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dataset) return;
    api
      .getAlgorithms(dataset.session_id)
      .then((res) => {
        setAlgorithms(res.algorithms);
        setSelected(new Set(res.algorithms.map((a) => a.key)));
        const initialParams = {};
        res.algorithms.forEach((a) => {
          initialParams[a.key] = { ...a.default_params };
        });
        setParams(initialParams);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingList(false));
  }, [dataset]);

  function toggleAlgo(key) {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
  }

  function updateParam(modelKey, paramKey, value) {
    setParams((prev) => ({ ...prev, [modelKey]: { ...prev[modelKey], [paramKey]: value } }));
  }

  async function handleTrain() {
    if (selected.size === 0) {
      setError("Select at least one algorithm.");
      return;
    }
    setTraining(true);
    setError(null);
    try {
      const algoList = Array.from(selected);
      const hyperparameters = {};
      algoList.forEach((key) => {
        hyperparameters[key] = coerceParams(params[key]);
      });
      const result = await api.trainModels(dataset.session_id, algoList, {
        hyperparameters,
        tuneHyperparameters: tune,
      });
      setTrainResult(result);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setTraining(false);
    }
  }

  if (!targetInfo) return null;

  return (
    <div className="max-w-4xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 4 of 6</p>
      <h1 className="font-display text-3xl font-semibold text-ink mb-2">Train models</h1>
      <p className="text-ink2 mb-6">
        Choose which algorithms to train for this {targetInfo.task_type} task. Each one is trained on an
        80/20 split of your cleaned data with the same preprocessing pipeline, so results are comparable.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <Card title="Tuning mode" className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTune(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${
              !tune ? "border-indigo-600 bg-indigo-600 text-white" : "border-line text-ink2 hover:border-indigo-300"
            }`}
          >
            Use my hyperparameters
          </button>
          <button
            onClick={() => setTune(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${
              tune ? "border-indigo-600 bg-indigo-600 text-white" : "border-line text-ink2 hover:border-indigo-300"
            }`}
          >
            Auto-tune (grid search)
          </button>
        </div>
        <p className="text-xs text-ink2 mt-2">
          Auto-tune runs cross-validated grid search over a predefined range per algorithm and may take
          longer, but it ignores manual values below.
        </p>
      </Card>

      {loadingList ? (
        <Spinner label="Loading available algorithms..." />
      ) : (
        <div className="space-y-3">
          {algorithms.map((algo) => (
            <Card key={algo.key} className={selected.has(algo.key) ? "" : "opacity-60"}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(algo.key)}
                  onChange={() => toggleAlgo(algo.key)}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-ink">{algo.display_name}</p>
                  {!tune && algo.tunable_params.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {algo.tunable_params.map((p) => (
                        <label key={p} className="text-xs font-mono text-ink2">
                          {p}
                          <input
                            type="text"
                            value={params[algo.key]?.[p] ?? ""}
                            disabled={!selected.has(algo.key)}
                            onChange={(e) => updateParam(algo.key, p, e.target.value)}
                            className="ml-2 w-20 px-1.5 py-0.5 border border-line rounded text-ink bg-paper disabled:bg-paper2"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        {training ? (
          <Spinner label={tune ? "Running grid search across algorithms..." : "Training selected models..."} />
        ) : (
          <button
            onClick={handleTrain}
            disabled={loadingList}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-40"
          >
            Train {selected.size} model{selected.size === 1 ? "" : "s"} →
          </button>
        )}
      </div>
    </div>
  );
}

/** Convert manual hyperparameter text inputs back into proper JS types (number, bool, null, or string). */
function coerceParams(paramObj) {
  const out = {};
  Object.entries(paramObj || {}).forEach(([k, v]) => {
    if (v === "" || v === null || v === undefined) return;
    if (v === "None" || v === "null") {
      out[k] = null;
    } else if (v === "true" || v === "false") {
      out[k] = v === "true";
    } else if (!isNaN(v) && v !== "") {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  });
  return out;
}
