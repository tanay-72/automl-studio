import React from "react";

export default function Spinner({ label = "Working..." }) {
  return (
    <div className="flex items-center gap-3 text-ink2 py-6">
      <span
        className="h-4 w-4 rounded-full border-2 border-indigo-100 border-t-indigo-600 animate-spin"
        aria-hidden="true"
      />
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}
