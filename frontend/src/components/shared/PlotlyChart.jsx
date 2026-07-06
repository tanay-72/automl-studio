import React from "react";
import Plot from "react-plotly.js";

/**
 * Renders a Plotly figure JSON object (as produced by plotly.io.to_json on
 * the backend) responsively inside its parent container.
 */
export default function PlotlyChart({ figure, style }) {
  if (!figure) return null;
  return (
    <Plot
      data={figure.data}
      layout={{
        ...figure.layout,
        autosize: true,
        font: { family: "Inter, sans-serif", color: "#1F2430" },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
      }}
      useResizeHandler
      style={{ width: "100%", height: "100%", ...style }}
      config={{ displaylogo: false, responsive: true }}
    />
  );
}
