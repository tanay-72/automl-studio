import React, { useState } from "react";
import Card from "./shared/Card.jsx";
import { Badge } from "./shared/Badge.jsx";
import PlotlyChart from "./shared/PlotlyChart.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

export default function CompareStep() {
  const { dataset, trainResult, setStep } = useAppState();
  const [expanded, setExpanded] = useState(null);

  if (!trainResult) return null;

  const metricKeys = Object.keys(trainResult.results[0]?.metrics || {});
  const isClassification = trainResult.task_type === "classification";

  return (
    <div className="max-w-5xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 5 of 6</p>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl font-semibold text-ink">Compare results</h1>
        <Badge tone="teal">best: {labelFor(trainResult, trainResult.best_model_key)}</Badge>
      </div>
      <p className="text-ink2 mb-6">
        Metrics computed on the held-out 20% test split. Ranked by{" "}
        {isClassification ? "F1 score" : "R² score"}.
      </p>

      <Card title="Metrics table" className="mb-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2 pr-4 font-mono text-ink2">model</th>
              {metricKeys.map((m) => (
                <th key={m} className="py-2 pr-4 font-mono text-ink2">
                  {m}
                </th>
              ))}
              <th className="py-2 pr-4 font-mono text-ink2">train time (s)</th>
              <th className="py-2 pr-4 font-mono text-ink2">download</th>
            </tr>
          </thead>
          <tbody>
            {trainResult.results.map((r) => (
              <tr
                key={r.model_key}
                className={`border-b border-line/60 ${
                  r.model_key === trainResult.best_model_key ? "bg-teal-50/50" : ""
                }`}
              >
                <td className="py-2 pr-4 font-medium text-ink">{r.display_name}</td>
                {metricKeys.map((m) => (
                  <td key={m} className="py-2 pr-4 font-mono text-ink2">
                    {r.metrics[m] !== undefined ? r.metrics[m].toFixed(4) : "—"}
                  </td>
                ))}
                <td className="py-2 pr-4 font-mono text-ink2">{r.training_time_sec}</td>
                <td className="py-2 pr-4">
                  <a
                    href={api.downloadModelUrl(dataset.session_id, r.model_key)}
                    className="text-indigo-600 hover:text-indigo-800 font-mono text-xs underline"
                  >
                    .joblib
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Metric comparison" className="mb-6">
        <div style={{ height: 420 }}>
          <PlotlyChart figure={trainResult.comparison_chart} />
        </div>
      </Card>

      {trainResult.roc_or_residual_chart && (
        <Card title={isClassification ? "ROC curves" : "Predicted vs actual"} className="mb-6">
          <div style={{ height: 420 }}>
            <PlotlyChart figure={trainResult.roc_or_residual_chart} />
          </div>
        </Card>
      )}

      <Card title="Feature importance" className="mb-6">
        <div className="space-y-4">
          {trainResult.results
            .filter((r) => r.feature_importance)
            .map((r) => (
              <div key={r.model_key}>
                <p className="text-sm font-medium text-ink mb-1">{r.display_name}</p>
                <FeatureImportanceBars importance={r.feature_importance} />
              </div>
            ))}
          {trainResult.results.every((r) => !r.feature_importance) && (
            <p className="text-sm text-ink2">None of the trained models expose feature importances.</p>
          )}
        </div>
      </Card>

      {isClassification && trainResult.confusion_matrices && (
        <Card title="Confusion matrices" className="mb-6">
          <div className="flex gap-2 mb-3 flex-wrap">
            {Object.keys(trainResult.confusion_matrices).map((key) => (
              <button
                key={key}
                onClick={() => setExpanded(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border ${
                  expanded === key
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-line text-ink2 hover:border-indigo-300"
                }`}
              >
                {labelFor(trainResult, key)}
              </button>
            ))}
          </div>
          {expanded && trainResult.confusion_matrices[expanded] && (
            <div style={{ height: 380 }}>
              <PlotlyChart figure={trainResult.confusion_matrices[expanded]} />
            </div>
          )}
          {!expanded && <p className="text-sm text-ink2">Pick a model above to see its confusion matrix.</p>}
        </Card>
      )}

      <button
        onClick={() => setStep(5)}
        className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700"
      >
        Make predictions →
      </button>
    </div>
  );
}

function labelFor(trainResult, key) {
  return trainResult.results.find((r) => r.model_key === key)?.display_name || key;
}

function FeatureImportanceBars({ importance }) {
  const entries = Object.entries(importance).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  return (
    <div className="space-y-1.5">
      {entries.map(([name, value]) => (
        <div key={name} className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink2 w-40 truncate" title={name}>
            {name}
          </span>
          <div className="flex-1 h-3 bg-paper2 rounded-sm overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-sm"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-ink2 w-16 text-right">{value.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}
