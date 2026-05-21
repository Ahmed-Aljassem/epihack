import { format } from "date-fns";
import { Link } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { useMyResponses } from "../hooks/useData";

export default function MyResponsesPage() {
  const { data: responses, loading, error } = useMyResponses();

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">My submissions</h1>
          <p className="console-subtitle">
            All survey responses you've submitted as a logged-in user
          </p>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-block" style={{ height: 220 }} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-title">Couldn't load your responses</div>
          <div className="empty-state-copy">{error.message || String(error)}</div>
        </div>
      ) : !responses?.length ? (
        <div className="empty-state">
          <div className="empty-state-title">You haven't submitted any responses yet</div>
          <div className="empty-state-copy">
            <Link to="/agency/surveys" className="auth-link">Browse active surveys</Link> to participate.
          </div>
        </div>
      ) : (
        <div className="list-card">
          {responses.map((r) => (
            <div key={r.id} className="list-row list-row--resource">
              <span className="list-icon">
                <FileText size={14} strokeWidth={2} />
              </span>
              <div>
                <div className="list-title">{r.survey_title || r.survey_id}</div>
                <div className="list-meta">
                  {r.answers?.length || 0} answer{r.answers?.length === 1 ? "" : "s"}
                  {" · "}
                  {r.submitted_at && format(new Date(r.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
              <Link to={`/agency/surveys/${r.survey_id}`} className="list-chev">
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
