import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Search, ChevronRight, Plus } from "lucide-react";
import { useSurveys } from "../hooks/useData";

const CATEGORY_FILTERS = [
  { id: "",            label: "All domains" },
  { id: "human",       label: "People" },
  { id: "animal",      label: "Animals" },
  { id: "environment", label: "Environment" },
  { id: "vector",      label: "Vector" },
];

export default function SurveysPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const { data: surveys, loading, error } = useSurveys(category ? { category } : {});

  const filtered = (surveys || []).filter((s) => {
    if (!q.trim()) return true;
    const term = q.trim().toLowerCase();
    return `${s.title} ${s.description} ${(s.tags || []).join(" ")}`.toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Surveys</h1>
          <p className="console-subtitle">
            Custom intake forms run by agency partners
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search surveys…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" disabled title="Survey authoring coming soon">
            <Plus size={14} strokeWidth={2.4} />
            New survey
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORY_FILTERS.map((c) => (
          <button
            key={c.id || "all"}
            className={`filter-chip ${category === c.id ? "is-active" : ""}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton-block" style={{ height: 220 }} />
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-title">Couldn't load surveys</div>
          <div className="empty-state-copy">{error.message || String(error)}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No surveys match your filters</div>
          <div className="empty-state-copy">
            Try a different category, or clear the search.
          </div>
        </div>
      ) : (
        <div className="list-card">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="list-row list-row--resource"
              onClick={() => navigate(s.id)}
            >
              <span className="list-icon">
                <ClipboardList size={14} strokeWidth={2} />
              </span>
              <div>
                <div className="list-title">{s.title}</div>
                <div className="list-meta">{s.description}</div>
                <div className="list-tags">
                  <span className={`badge badge-${mapCat(s.category)}`}>{categoryLabel(s.category)}</span>
                  <span className="badge">{s.response_count ?? 0} responses</span>
                  <span className={`badge ${s.status === "paused" ? "badge-warn" : "badge-accent"}`}>
                    {s.status || "active"}
                  </span>
                  {(s.tags || []).map((t) => (
                    <span key={t} className="badge">#{t}</span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} className="list-chev" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Map backend category enum -> badge slug used in CSS.
function mapCat(c) {
  return c === "human" ? "people" : c === "environment" ? "env" : c;
}
function categoryLabel(c) {
  if (c === "human") return "People";
  if (c === "environment") return "Environment";
  if (c === "animal") return "Animal";
  if (c === "vector") return "Vector";
  return c;
}
