import React from "react";

export default function Spinner({ label = "Working..." }) {
  return (
    <div className="flex items-center gap-3 text-ink2 py-6">
      <span className="relative h-5 w-5 shrink-0" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-2 border-indigo-100" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-violet-500 animate-spin" />
      </span>
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}
