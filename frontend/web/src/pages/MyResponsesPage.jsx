import { useMyResponses } from "../hooks/useData";
import { format } from "date-fns";
import { FileText } from "lucide-react";

export default function MyResponsesPage() {
  const { data: responses, loading } = useMyResponses();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Submissions</h1>
        <p className="page-subtitle">All survey responses you have submitted</p>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(responses || []).map((r) => (
            <div key={r.id} className="card" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-dim)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <FileText size={16} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Survey ID: {r.survey_id}</div>
                <div style={{ color: "var(--muted)", fontSize: 11 }}>
                  {r.answers.length} answers submitted · {format(new Date(r.submitted_at), "MMM d, yyyy 'at' HH:mm")}
                </div>
                {r.notes && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--text)", background: "var(--surface-2)", borderRadius: 6, padding: "6px 10px" }}>
                    {r.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
          {!responses?.length && (
            <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
              You haven't submitted any responses yet. Head to Surveys to participate.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
