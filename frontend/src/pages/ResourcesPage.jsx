import { useState } from "react";
import {
  Search, BookOpen, FileText, ExternalLink, ShieldCheck,
  Bug, Droplet, AlertTriangle,
} from "lucide-react";

const FILTERS = [
  { id: "all",       label: "All" },
  { id: "playbook",  label: "Playbooks" },
  { id: "reference", label: "Reference" },
  { id: "training",  label: "Training" },
];

const RESOURCES = [
  {
    id: "rabies",
    title: "Rabies surveillance playbook",
    meta: "AZ Game & Fish · last updated Apr 2026",
    type: "playbook",
    tag: "Animal",
    tagTone: "animal",
    icon: ShieldCheck,
  },
  {
    id: "vector",
    title: "Mosquito surveillance & response",
    meta: "Pima Co. Vector Control · v3.1",
    type: "playbook",
    tag: "Vector",
    tagTone: "vector",
    icon: Bug,
  },
  {
    id: "water",
    title: "Water contamination response checklist",
    meta: "ADEQ · routing guide",
    type: "reference",
    tag: "Environment",
    tagTone: "env",
    icon: Droplet,
  },
  {
    id: "fever",
    title: "Fever cluster investigation guide",
    meta: "AZDHS · CDC-aligned",
    type: "playbook",
    tag: "People",
    tagTone: "people",
    icon: AlertTriangle,
  },
  {
    id: "intake",
    title: "Public intake taxonomy reference",
    meta: "Minimum data parameters · One Health",
    type: "reference",
    tag: "Reference",
    tagTone: "info",
    icon: FileText,
  },
  {
    id: "training",
    title: "Triage analyst onboarding",
    meta: "60 min · video + quiz",
    type: "training",
    tag: "Training",
    tagTone: "info",
    icon: BookOpen,
  },
];

export default function ResourcesPage() {
  const [filter, setFilter] = useState("all");
  const visible = RESOURCES.filter((r) => filter === "all" || r.type === filter);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Resources</h1>
          <p className="console-subtitle">
            Playbooks, references, and training for triage and response
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search resources…"
            />
          </div>
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
        {visible.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="list-row list-row--resource">
              <span className="list-icon">
                <Icon size={14} strokeWidth={2} />
              </span>
              <div>
                <div className="list-title">{r.title}</div>
                <div className="list-meta">{r.meta}</div>
                <div className="list-tags">
                  <span className={`badge badge-${r.tagTone}`}>{r.tag}</span>
                </div>
              </div>
              <ExternalLink size={16} className="list-chev" />
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
            No resources match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
