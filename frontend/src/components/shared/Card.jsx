import React from "react";

export default function Card({ title, eyebrow, action, children, className = "", hover = false }) {
  return (
    <div
      className={`bg-white/90 backdrop-blur-sm border border-line/80 rounded-2xl shadow-soft p-5 transition-all duration-300 ${
        hover ? "hover:shadow-lift hover:-translate-y-0.5 hover:border-indigo-200" : ""
      } ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-mono uppercase tracking-wider text-indigo-500/80 mb-1">{eyebrow}</p>
            )}
            {title && <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
