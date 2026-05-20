import { useState } from "react";
import { Search, Plus, Settings } from "lucide-react";

const INITIAL_RULES = [
  {
    id: "rule-1",
    title: "Animal · unsteady · rural ZIP → AZGF",
    meta: "Routes to AZ Game & Fish · rabies surveillance",
    enabled: true,
  },
  {
    id: "rule-2",
    title: "People · fever cluster → Pima Co. Epi",
    meta: "Triggers when ≥ 3 reports in 7 days in the same ZIP",
    enabled: true,
  },
  {
    id: "rule-3",
    title: "Vector · mosquito activity ↑ → Vector Control",
    meta: "Routes to Pima Co. Vector Control when trend > +20%",
    enabled: true,
  },
  {
    id: "rule-4",
    title: "Environment · water contamination → ADEQ",
    meta: "Routes any environment + water keywords to ADEQ",
    enabled: false,
  },
  {
    id: "rule-5",
    title: "Livestock · sick animals → AZDA",
    meta: "Routes to AZ Dept. of Agriculture · livestock health",
    enabled: true,
  },
  {
    id: "rule-6",
    title: "Wildlife · dead animals → AZGF",
    meta: "Wildlife incident reports auto-routed to AZGF",
    enabled: false,
  },
];

export default function RoutingRulesPage() {
  const [rules, setRules] = useState(INITIAL_RULES);

  const toggle = (id) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const activeCount = rules.filter((r) => r.enabled).length;

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Routing rules</h1>
          <p className="console-subtitle">
            {activeCount} of {rules.length} rules active · changes take effect immediately
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search rules…"
            />
          </div>
          <button className="btn btn-primary">
            <Plus size={14} strokeWidth={2.4} />
            New rule
          </button>
        </div>
      </div>

      <div className="list-card">
        {rules.map((r) => (
          <div key={r.id} className="list-row list-row--rule">
            <Settings size={16} className="list-chev" />
            <div>
              <div className="list-title">{r.title}</div>
              <div className="list-meta">{r.meta}</div>
            </div>
            <span className="list-meta">{r.enabled ? "Active" : "Paused"}</span>
            <button
              type="button"
              className={`switch ${r.enabled ? "is-on" : ""}`}
              aria-pressed={r.enabled}
              aria-label={`Toggle ${r.title}`}
              onClick={() => toggle(r.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
