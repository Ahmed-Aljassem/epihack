/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Keep shared map layer visibility modes aligned across the
dashboard and full map views.
*/

export const MAP_LAYER_MODES = [
  { id: "reports", label: "Reports" },
  { id: "both", label: "Combined" },
  { id: "resources", label: "Resources" },
];

export function getMapLayerDescription(mode) {
  if (mode === "resources") {
    return "Resource mode hides report clusters and heatmaps so response planners can compare cooling, hydration, and respite support sites more clearly.";
  }

  if (mode === "both") {
    return "Combined mode keeps surveillance signals visible while layering clustered response resources on top.";
  }

  return "Report mode focuses on surveillance signals only.";
}
