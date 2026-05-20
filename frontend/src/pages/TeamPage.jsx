import { useState } from "react";
import { Search, UserPlus, MoreHorizontal } from "lucide-react";

const TEAM = [
  {
    id: "lr",
    name: "L. Romero",
    initials: "LR",
    role: "Epidemiologist",
    org: "Pima Co. · Epi",
    status: "online",
    color: "blue",
  },
  {
    id: "kn",
    name: "K. Nakamura",
    initials: "KN",
    role: "Triage analyst",
    org: "Pima Co. · Triage",
    status: "online",
    color: "green",
  },
  {
    id: "jm",
    name: "J. Morales",
    initials: "JM",
    role: "Vector control lead",
    org: "Pima Co. · Vector Control",
    status: "away",
    color: "orange",
  },
  {
    id: "sb",
    name: "S. Begay",
    initials: "SB",
    role: "Wildlife liaison",
    org: "AZ Game & Fish",
    status: "online",
    color: "pink",
  },
  {
    id: "tp",
    name: "T. Park",
    initials: "TP",
    role: "Public communications",
    org: "AZDHS",
    status: "offline",
    color: "gray",
  },
];

const FILTERS = [
  { id: "all",     label: "All" },
  { id: "online",  label: "Online" },
  { id: "away",    label: "Away" },
  { id: "offline", label: "Offline" },
];

export default function TeamPage() {
  const [filter, setFilter] = useState("all");
  const visible = TEAM.filter((m) => filter === "all" || m.status === filter);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Team</h1>
          <p className="console-subtitle">
            {TEAM.length} members across triage, vector control, wildlife, and communications
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search team…"
            />
          </div>
          <button className="btn btn-primary">
            <UserPlus size={14} strokeWidth={2.4} />
            Invite member
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? "is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="list-card">
        {visible.map((m) => (
          <div key={m.id} className="list-row list-row--team">
            <span className={`avatar avatar--${m.color}`}>{m.initials}</span>
            <div>
              <div className="list-title">{m.name}</div>
              <div className="list-meta">{m.role} · {m.org}</div>
            </div>
            <span className={`status-dot status-dot--${m.status}`}>
              {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
            </span>
            <button type="button" className="btn-icon" aria-label={`Manage ${m.name}`}>
              <MoreHorizontal size={16} />
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No team members match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
