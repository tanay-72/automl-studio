import React from "react";

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3.5 text-base gap-2.5",
};

const VARIANTS = {
  primary:
    "bg-brand-gradient text-white shadow-soft hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft",
  secondary:
    "bg-white border border-line text-ink shadow-sm hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-soft active:translate-y-0",
  ghost: "text-ink2 hover:text-ink hover:bg-paper2",
  danger: "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:-translate-y-0.5",
};

/**
 * Single source of truth for button visuals across the wizard. Using one
 * component (instead of repeating Tailwind strings per step) keeps hover/
 * focus/disabled behavior consistent everywhere it's used.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  as: As = "button",
  ...props
}) {
  return (
    <As
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-out disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </As>
  );
}
