import React from "react";

export default function Card({ title, eyebrow, action, children, className = "" }) {
  return (
    <div className={`bg-white border border-line rounded-xl shadow-card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {eyebrow && (
              <p className="text-xs font-mono uppercase tracking-wider text-ink2 mb-1">{eyebrow}</p>
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
