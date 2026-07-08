import React from "react";

export function Badge({ children, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200/70",
    teal: "bg-teal-50 text-teal-700 ring-teal-200/70",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/70",
    rose: "bg-rose-50 text-rose-700 ring-rose-200/70",
  };
  const dots = {
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono ring-1 ring-inset ${tones[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4 animate-fade-in-up shadow-sm">
      <span className="flex items-start gap-2">
        <span aria-hidden="true">⚠</span>
        <span>{message}</span>
      </span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-700 hover:text-rose-900 font-mono shrink-0 leading-none rounded-full hover:bg-rose-100 h-5 w-5 flex items-center justify-center transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
