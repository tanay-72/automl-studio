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
    <>
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-8">
          <div className="mb-9 flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient shadow-glow flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
              ML
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-ink leading-tight">AutoML Studio</p>
              <p className="text-[11px] font-mono text-ink2/80">csv → cleaned → trained → yours</p>
            </div>
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
                      className={`absolute left-[11px] top-6 w-px h-full transition-colors duration-500 ${
                        isDone ? "bg-gradient-to-b from-indigo-600 to-violet-500" : "bg-line"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <button
                    onClick={() => reachable && onJump(i)}
                    disabled={!reachable}
                    className={`flex items-start gap-3 text-left w-full group rounded-lg -mx-2 px-2 py-1 transition-colors duration-200 ${
                      reachable ? "cursor-pointer hover:bg-white/60" : "cursor-not-allowed opacity-45"
                    }`}
                  >
                    <span
                      className={`relative z-10 flex items-center justify-center h-6 w-6 rounded-full text-xs font-mono shrink-0 mt-0.5 border transition-all duration-300 ${
                        isCurrent
                          ? "bg-brand-gradient border-transparent text-white shadow-glow scale-110"
                          : isDone
                          ? "bg-brand-gradient border-transparent text-white"
                          : "bg-paper border-line text-ink2"
                      }`}
                    >
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span>
                      <span
                        className={`block text-sm font-medium transition-colors ${
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

      {/* Compact top progress bar shown when the vertical rail is hidden (below lg) */}
      <div className="lg:hidden sticky top-0 z-20 -mx-6 px-6 py-3 mb-6 bg-paper/85 backdrop-blur-md border-b border-line">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-6 w-6 rounded-lg bg-brand-gradient shadow-glow flex items-center justify-center text-white font-display font-bold text-[10px] shrink-0">
            ML
          </span>
          <p className="font-display text-sm font-semibold text-ink">AutoML Studio</p>
          <span className="ml-auto text-xs font-mono text-ink2">
            {currentStep + 1}/{STEPS.length} · {STEPS[currentStep].label}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            const reachable = i <= maxReachableStep;
            return (
              <button
                key={s.label}
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                aria-label={s.label}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isDone || isCurrent ? "bg-brand-gradient" : "bg-line"
                } ${reachable ? "" : "opacity-50"}`}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
