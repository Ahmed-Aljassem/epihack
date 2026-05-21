/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Render the shared report-filter controls so report-driven
pages stay visually aligned and use the same filter inputs.
*/

import { useMemo } from "react";
import {
  REPORT_CATEGORY_FILTERS,
  REPORT_RANGE_FILTERS,
  REPORT_STATUS_FILTERS,
  getReportFilterOptions,
  hasActiveReportFilters,
} from "../../lib/reportFilters";

export default function ReportFilters({
  filters,
  onChange,
  optionReports = [],
  categoryCounts = null,
  resultCount = null,
  showCategory = true,
  showRange = true,
  showStatus = false,
  showCounty = true,
  showZip = true,
  onClear,
}) {
  const { counties, zips } = useMemo(
    () => getReportFilterOptions(optionReports),
    [optionReports],
  );

  const hasActiveFilters = hasActiveReportFilters(filters, {
    includeStatus: showStatus,
    includeSearch: true,
  });

  return (
    <div className="report-filters">
      {(showCategory || showRange || resultCount !== null) && (
        <div className="filter-bar report-filters-row">
          {showCategory &&
            REPORT_CATEGORY_FILTERS.map((category) => {
              const countLabel =
                categoryCounts && categoryCounts[category.id] !== undefined
                  ? ` · ${categoryCounts[category.id]}`
                  : "";

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`filter-chip ${filters.category === category.id ? "is-active" : ""}`}
                  onClick={() => onChange({ category: category.id })}
                >
                  {category.label}
                  {countLabel}
                </button>
              );
            })}

          {showRange && (
            <>
              <span className="filter-bar-spacer" />
              <div className="range-tabs" aria-label="Report date range">
                {REPORT_RANGE_FILTERS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`range-tab ${filters.range === range ? "is-active" : ""}`}
                    onClick={() => onChange({ range })}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </>
          )}

          {resultCount !== null && (
            <span className="report-filter-summary">
              {resultCount} report{resultCount === 1 ? "" : "s"} in view
            </span>
          )}
        </div>
      )}

      {(showStatus || showCounty || showZip || hasActiveFilters) && (
        <div className="report-filter-grid">
          {showStatus && (
            <label className="field report-filter-field">
              <span className="label">Stage</span>
              <select
                className="select"
                value={filters.status}
                onChange={(event) => onChange({ status: event.target.value })}
                aria-label="Filter reports by stage"
              >
                {REPORT_STATUS_FILTERS.map((status) => (
                  <option key={status.id || "all"} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showCounty && (
            <label className="field report-filter-field">
              <span className="label">County</span>
              <select
                className="select"
                value={filters.county}
                onChange={(event) => onChange({ county: event.target.value })}
                aria-label="Filter reports by county"
              >
                <option value="">All counties</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showZip && (
            <label className="field report-filter-field">
              <span className="label">ZIP code</span>
              <select
                className="select"
                value={filters.zip}
                onChange={(event) => onChange({ zip: event.target.value })}
                aria-label="Filter reports by ZIP code"
              >
                <option value="">All ZIP codes</option>
                {zips.map((zip) => (
                  <option key={zip} value={zip}>
                    {zip}
                  </option>
                ))}
              </select>
            </label>
          )}

          {hasActiveFilters && onClear && (
            <button
              type="button"
              className="btn btn-ghost report-filters-clear"
              onClick={onClear}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
