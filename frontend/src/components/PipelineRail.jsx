import React from "react";

const STEPS = [
  { label: "Upload data", hint: "CSV in" },
  { label: "Choose target", hint: "Pick the column to predict" },
  { label: "Explore", hint: "EDA dashboard" },
  { label: "Train", hint: "Fit & tune models" },
  { label: "Compare", hint: "Metrics & charts" },
  { label: "Predict", hint: "Try custom inputs" },
];

/**
 * A literal pipeline: the app's steps run in a fixed order, so a vertical
 * rail with a connecting line is the actual shape of the workflow, not
 * decoration. Clicking a completed step jumps back to revisit it.
 */
export default function PipelineRail({ currentStep, maxReachableStep, onJump }) {
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-8">
        <div className="mb-8">
          <p className="font-display text-xl font-semibold text-ink">AutoML Studio</p>
          <p className="text-xs font-mono text-ink2 mt-1">csv → cleaned → trained → yours</p>
        </div>
        <ol className="relative">
          {STEPS.map((s, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            const reachable = i <= maxReachableStep;
            return (
              <li key={s.label} className="relative pb-8 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    className={`absolute left-[11px] top-6 w-px h-full ${
                      isDone ? "bg-indigo-600" : "bg-line"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <button
                  onClick={() => reachable && onJump(i)}
                  disabled={!reachable}
                  className={`flex items-start gap-3 text-left w-full group ${
                    reachable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <span
                    className={`relative z-10 flex items-center justify-center h-6 w-6 rounded-full text-xs font-mono shrink-0 mt-0.5 border ${
                      isCurrent
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isDone
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-paper border-line text-ink2"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-medium ${
                        isCurrent ? "text-ink" : "text-ink2"
                      } group-hover:text-indigo-700`}
                    >
                      {s.label}
                    </span>
                    <span className="block text-xs text-ink2/70 font-mono">{s.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
