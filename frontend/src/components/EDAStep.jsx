import React, { useEffect, useState } from "react";
import Card from "./shared/Card.jsx";
import Spinner from "./shared/Spinner.jsx";
import Button from "./shared/Button.jsx";
import { Badge, ErrorBanner } from "./shared/Badge.jsx";
import PlotlyChart from "./shared/PlotlyChart.jsx";
import { api } from "../api/client.js";
import { useAppState } from "../context/AppContext.jsx";

const TABS = ["Summary", "Missing values", "Correlation", "Distributions", "Box plots", "vs. Target"];

export default function EDAStep() {
  const { dataset, targetInfo, setStep } = useAppState();
  const [eda, setEda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("Summary");

  useEffect(() => {
    if (!dataset || !targetInfo) return;
    setLoading(true);
    api
      .getEDA(dataset.session_id)
      .then(setEda)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [dataset, targetInfo]);

  if (!targetInfo) return null;

  return (
    <div className="max-w-5xl">
      <p className="text-xs font-mono uppercase tracking-wider text-indigo-600 mb-2">Step 3 of 6</p>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">Explore your data</h1>
        <div className="flex gap-2">
          <Badge tone={targetInfo.task_type === "classification" ? "teal" : "indigo"}>
            {targetInfo.task_type}
          </Badge>
          <Badge>target: {targetInfo.target_column}</Badge>
        </div>
      </div>
      <p className="text-ink2 mb-6">
        {targetInfo.dropped_columns.length > 0 ? (
          <>Cleaning dropped {targetInfo.dropped_columns.length} column(s): {targetInfo.dropped_columns.join(", ")}.</>
        ) : (
          "No columns were dropped during cleaning."
        )}{" "}
        {targetInfo.numeric_features.length} numeric and {targetInfo.categorical_features.length} categorical
        feature(s) remain.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {loading ? (
        <Card>
          <Spinner label="Computing statistics and rendering charts..." />
        </Card>
      ) : eda ? (
        <>
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-paper2/70 border border-line/70 overflow-x-auto w-fit max-w-full">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  tab === t ? "bg-white text-indigo-700 shadow-sm" : "text-ink2 hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Summary" && <SummaryTab eda={eda} />}
          {tab === "Missing values" && <MissingTab eda={eda} />}
          {tab === "Correlation" && <CorrelationTab eda={eda} />}
          {tab === "Distributions" && <ChartGrid charts={eda.distributions} />}
          {tab === "Box plots" && <ChartGrid charts={eda.box_plots} />}
          {tab === "vs. Target" && <ChartGrid charts={eda.feature_target_relationships} extra={eda.class_balance} />}

          <div className="mt-8">
            <Button onClick={() => setStep(3)}>Continue to training →</Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryTab({ eda }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Numeric features" eyebrow={`${Object.keys(eda.summary_stats.numeric).length} columns`}>
        <div className="overflow-x-auto">
          <table className="text-xs font-mono w-full">
            <thead>
              <tr className="text-ink2 text-left border-b border-line">
                <th className="py-1.5 pr-3">column</th>
                <th className="py-1.5 pr-3">mean</th>
                <th className="py-1.5 pr-3">std</th>
                <th className="py-1.5 pr-3">min</th>
                <th className="py-1.5 pr-3">max</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(eda.summary_stats.numeric).map(([col, s]) => (
                <tr key={col} className="border-b border-line/50">
                  <td className="py-1.5 pr-3 text-ink">{col}</td>
                  <td className="py-1.5 pr-3 text-ink2">{s.mean ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-ink2">{s.std ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-ink2">{s.min ?? "—"}</td>
                  <td className="py-1.5 pr-3 text-ink2">{s.max ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Categorical features" eyebrow={`${Object.keys(eda.summary_stats.categorical).length} columns`}>
        <div className="space-y-3">
          {Object.entries(eda.summary_stats.categorical).map(([col, s]) => (
            <div key={col}>
              <p className="text-sm font-medium text-ink">
                {col} <span className="text-xs font-mono text-ink2">({s.unique_values} unique)</span>
              </p>
              <p className="text-xs text-ink2 font-mono">
                {Object.entries(s.top_values)
                  .slice(0, 5)
                  .map(([k, v]) => `${k}:${v}`)
                  .join("  ")}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MissingTab({ eda }) {
  const report = eda.missing_value_report;
  return (
    <Card>
      {report.chart ? (
        <div style={{ height: 360 }}>
          <PlotlyChart figure={report.chart} />
        </div>
      ) : (
        <p className="text-sm text-ink2">No missing values found in the cleaned dataset. 🎉</p>
      )}
    </Card>
  );
}

function CorrelationTab({ eda }) {
  return (
    <Card>
      {eda.correlation_heatmap ? (
        <div style={{ height: 480 }}>
          <PlotlyChart figure={eda.correlation_heatmap} />
        </div>
      ) : (
        <p className="text-sm text-ink2">Not enough numeric columns to compute correlations.</p>
      )}
    </Card>
  );
}

function ChartGrid({ charts, extra }) {
  const entries = Object.entries(charts || {});
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {extra && extra.chart && (
        <Card title="Class balance" className="md:col-span-2">
          <div style={{ height: 320 }}>
            <PlotlyChart figure={extra.chart} />
          </div>
          {extra.is_imbalanced && (
            <p className="text-xs text-amber mt-2 font-mono">
              ⚠ Classes look imbalanced — consider this when reading accuracy.
            </p>
          )}
        </Card>
      )}
      {entries.map(([col, fig]) => (
        <Card key={col} hover>
          <div style={{ height: 320 }}>
            <PlotlyChart figure={fig} />
          </div>
        </Card>
      ))}
      {entries.length === 0 && !extra && <p className="text-sm text-ink2">Nothing to show here.</p>}
    </div>
  );
}
