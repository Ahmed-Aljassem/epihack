/*
Shared view-mode options for console maps.

Keeps the dashboard and full map page aligned when we expose different
spatial render styles such as points, heatmap, or both together.
*/

export const MAP_VIEW_MODES = [
  { id: "points", label: "Points" },
  { id: "heatmap", label: "Heatmap" },
  { id: "both", label: "Both" },
];

export function getMapModeDescription(mode) {
  if (mode === "points") {
    return "Point view shows clustered report locations you can drill into.";
  }
  if (mode === "heatmap") {
    return "Heatmap view emphasizes where nearby reports are concentrating across the current filtered set.";
  }
  return "Both view overlays report locations on top of the hotspot surface for quick triage.";
}
