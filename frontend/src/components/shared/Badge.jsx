import React from "react";

export function Badge({ children, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm mb-4">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-rose-700 hover:text-rose-900 font-mono" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
