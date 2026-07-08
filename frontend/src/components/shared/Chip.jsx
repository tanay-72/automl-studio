import React from "react";

/**
 * Pill-shaped toggle button used for the small "pick one of N" controls
 * scattered across the wizard (problem type, tuning mode, model select,
 * confusion-matrix picker, EDA tabs).
 */
export function Chip({ active, children, className = "", ...props }) {
  return (
    <button
      className={`px-3.5 py-1.5 rounded-full text-xs font-mono border transition-all duration-200 ${
        active
          ? "border-transparent bg-brand-gradient text-white shadow-glow"
          : "border-line bg-white text-ink2 hover:border-indigo-300 hover:text-ink hover:-translate-y-0.5"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** A selectable card-style tile, used for column pickers and algorithm rows. */
export function Tile({ active, children, className = "", ...props }) {
  return (
    <button
      className={`text-left rounded-xl border transition-all duration-200 ${
        active
          ? "border-indigo-400 bg-indigo-50/70 shadow-glow ring-1 ring-indigo-200"
          : "border-line bg-white hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-soft"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
