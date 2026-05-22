/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Render reusable heat-relief resource toggles for the shared
report maps so dashboard and map views expose the same marker controls.
*/

import {
  RESOURCE_GROUP_ORDER,
  RESOURCE_GROUPS,
} from "../../data/heatReliefResources";

export default function ResourceGroupToggles({
  enabledGroups,
  onToggleGroup,
  groupCounts = {},
  loadingGroups = {},
  errorGroups = {},
  totalEnabledCount = 0,
  compact = false,
  focusMode = false,
}) {
  const enabledSet = new Set(enabledGroups);

  return (
    <div
      className={[
        "resource-toggle-panel",
        compact ? "is-compact" : "",
        focusMode ? "is-focus" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="resource-toggle-header">
        <div>
          <div className="resource-toggle-title">
            {focusMode ? "Heat-relief resource layers" : "Heat-relief resources"}
          </div>
          <div className="resource-toggle-copy">
            {focusMode
              ? "Resource view removes report clutter and lets you compare support sites by type across Arizona."
              : "Demo cooling centers, hydration stations, and respite centers can be overlaid on the report map without affecting report counts."}
          </div>
        </div>
        <span className="resource-toggle-badge">
          {focusMode ? "Resource view" : `${totalEnabledCount} live`}
        </span>
      </div>

      <div className="resource-toggle-list" role="group" aria-label="Heat-relief resource layers">
        {RESOURCE_GROUP_ORDER.map((group) => {
          const meta = RESOURCE_GROUPS[group];
          const active = enabledSet.has(group);
          const count = groupCounts[group] || 0;
          const loading = Boolean(loadingGroups[group]);
          const hasError = Boolean(errorGroups[group]);

          return (
            <button
              key={group}
              type="button"
              className={`resource-toggle ${active ? "is-active" : ""}`}
              onClick={() => onToggleGroup(group)}
              aria-pressed={active}
              style={{
                "--resource-color": meta.color,
              }}
            >
              <span className="resource-toggle-card-head">
                <span className="resource-toggle-icon-wrap">
                  <span className="resource-toggle-swatch">{meta.markerLabel}</span>
                </span>
                <span className="resource-toggle-text">
                  <span className="resource-toggle-label">{meta.label}</span>
                  {focusMode && meta.descriptor && (
                    <span className="resource-toggle-descriptor">{meta.descriptor}</span>
                  )}
                </span>
                <span className="resource-toggle-metrics">
                  <span className="resource-toggle-count">
                    {loading ? "..." : `${count}`}
                  </span>
                  {focusMode && !loading && (
                    <span className="resource-toggle-count-label">sites</span>
                  )}
                </span>
              </span>
              {focusMode && (
                <span className="resource-toggle-hint">{meta.hint}</span>
              )}
              {hasError && (
                <span className="resource-toggle-status resource-toggle-status--inline">
                  Retry
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="resource-toggle-summary">
        {totalEnabledCount > 0
          ? `Showing ${totalEnabledCount} demo resource site${totalEnabledCount === 1 ? "" : "s"} on this map.`
          : focusMode
            ? "Choose one or more resource types to bring the response-site layer back into view."
            : "Toggle a group to add demo heat-relief sites to the map."}
      </div>
    </div>
  );
}
