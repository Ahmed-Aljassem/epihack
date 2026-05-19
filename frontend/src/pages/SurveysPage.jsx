import { useState } from "react";
import { Link } from "react-router-dom";
import { useSurveys } from "../hooks/useData";
import { ClipboardList, ChevronRight } from "lucide-react";

const CATEGORIES = ["", "human", "animal", "environment", "vector"];

export default function SurveysPage() {
  const [category, setCategory] = useState("");
  const { data: surveys, loading } = useSurveys(category ? { category } : {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Active Surveys</h1>
        <p className="page-subtitle">Participate in surveillance across all domains</p>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map((c) => (
          <button
            key={c || "all"}
            className={`btn ${category === c ? "btn-primary" : "btn-ghost"}`}
            style={{ padding: "6px 14px", fontSize: 12 }}
            onClick={() => setCategory(c)}
          >
            {c || "All Domains"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading surveys…</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {(surveys || []).map((survey) => (
            <Link
              key={survey.id}
              to={`/surveys/${survey.id}`}
              style={{ textDecoration: "none" }}
            >
              <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <ClipboardList size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{survey.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {survey.description}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className={`badge badge-${survey.category}`}>{survey.category}</span>
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      {survey.response_count} responses
                    </span>
                    {survey.tags?.map((t) => (
                      <span key={t} style={{ fontSize: 10, color: "var(--muted)", background: "var(--surface-2)", borderRadius: 4, padding: "1px 6px" }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--muted)" />
              </div>
            </Link>
          ))}
          {!surveys?.length && (
            <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
              No surveys found for this domain.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
