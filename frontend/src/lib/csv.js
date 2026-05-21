/*
Tiny CSV helper. Escapes fields with quotes/commas/newlines, triggers
a browser download. No external dependency.
*/

function escapeField(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV(rows, columns) {
  const header = columns.map((c) => escapeField(c.label || c.key)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeField(typeof c.value === "function" ? c.value(row) : row[c.key])).join(",")
  );
  return [header, ...lines].join("\n");
}

export function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportReportsCSV(reports, filenamePrefix = "reports") {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const csv = toCSV(reports, [
    { key: "id",         label: "ID" },
    { key: "category",   label: "Category" },
    { key: "status",     label: "Status" },
    { key: "summary",    label: "Summary" },
    { key: "zip",        label: "ZIP" },
    { key: "county",     label: "County" },
    { key: "latitude",   label: "Latitude" },
    { key: "longitude",  label: "Longitude" },
    { key: "submittedAt", label: "Submitted" },
  ]);
  downloadCSV(`${filenamePrefix}-${stamp}.csv`, csv);
}
