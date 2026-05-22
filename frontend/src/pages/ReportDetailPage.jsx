import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Search, Check, ArrowUpRight, Paperclip, ChevronDown, UserPlus,
} from "lucide-react";
import DetailLocationMap from "../components/console/DetailLocationMap";
import {
  useReport, updateStatus, addNote, reassign,
} from "../hooks/useReports";

const ACTIVITY_ICON = {
  check:  { cls: "activity-icon--check",  Icon: Check },
  routed: { cls: "activity-icon--routed", Icon: ArrowUpRight },
  note:   { cls: "activity-icon--note",   Icon: Paperclip },
};

const STATUS_OPTIONS = ["New", "In review", "Routed", "Resolved"];

// Tiny placeholder team list. (TeamPage uses the same source — keep them in
// sync if you change one.)
const TEAM = [
  { id: "lr", name: "L. Romero (Pima · Epi)" },
  { id: "kn", name: "K. Nakamura (Pima · Triage)" },
  { id: "jm", name: "J. Morales (Vector Control)" },
  { id: "sb", name: "S. Begay (AZ Game & Fish)" },
  { id: "tp", name: "T. Park (AZDHS)" },
];

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report, loading, error } = useReport(id);
  const [note, setNote] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const statusMenuRef = useRef(null);
  const assignMenuRef = useRef(null);

  // Close menus on outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) setStatusOpen(false);
      if (assignMenuRef.current && !assignMenuRef.current.contains(e.target)) setAssignOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Combine the report's own activity (rich-overlay records) with
  // any session notes from the override store.
  const activity = useMemo(() => {
    if (!report) return [];
    const base = Array.isArray(report.activity) ? [...report.activity] : [];
    const noteEvents = (report.notes || []).map((n) => ({
      kind: "note",
      title: `Note · ${n.author}`,
      meta: n.body,
      time: format(new Date(n.time), "h:mm a"),
    }));
    return [...base, ...noteEvents];
  }, [report]);

  if (loading) {
    return (
      <div>
        <div className="console-header">
          <div>
            <h1 className="console-title">Loading report…</h1>
            <p className="console-subtitle">{id}</p>
          </div>
        </div>
        <div className="skeleton-block" style={{ height: 160, marginBottom: 14 }} />
        <div className="skeleton-block" style={{ height: 240 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="console-header">
          <div>
            <h1 className="console-title">Couldn't load this report</h1>
            <p className="console-subtitle">{error.message || String(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div>
        <div className="console-header">
          <div>
            <h1 className="console-title">Report not found</h1>
            <p className="console-subtitle">{id}</p>
          </div>
        </div>
      </div>
    );
  }

  const onPostNote = () => {
    const body = note.trim();
    if (!body) return;
    addNote(report.id, body);
    setNote("");
  };

  const onChangeStatus = (next) => {
    updateStatus(report.id, next);
    setStatusOpen(false);
  };

  const onReassign = (assignee) => {
    reassign(report.id, assignee);
    setAssignOpen(false);
  };

  const subtitle = [
    report.category,
    report.sourceType === "vector" ? "vector-linked" : null,
    report.subcategory,
    report.location?.zip && report.location.zip !== "—" ? report.location.zip : null,
    report.location?.county,
    `submitted ${report.submittedLabel || report.submittedShort || ""}`,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">
            {report.id} · {report.summary}
          </h1>
          <p className="console-subtitle">{subtitle}</p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reports, places, IDs…"
              onFocus={() => navigate("/agency/reports")}
            />
          </div>

          <div ref={assignMenuRef} style={{ position: "relative" }}>
            <button className="btn btn-ghost" onClick={() => setAssignOpen((v) => !v)}>
              <UserPlus size={14} strokeWidth={2.2} />
              {report.assignee ? report.assignee.split(" (")[0] : "Reassign"}
            </button>
            {assignOpen && (
              <div className="popover-menu">
                {TEAM.map((t) => (
                  <button
                    key={t.id}
                    className="popover-item"
                    onClick={() => onReassign(t.name)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={statusMenuRef} style={{ position: "relative" }}>
            <button className="btn btn-primary" onClick={() => setStatusOpen((v) => !v)}>
              {report.status}
              <ChevronDown size={14} strokeWidth={2.2} />
            </button>
            {statusOpen && (
              <div className="popover-menu">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    className={`popover-item ${s === report.status ? "is-active" : ""}`}
                    onClick={() => onChangeStatus(s)}
                  >
                    {s}
                    {s === report.status && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="detail-meta-row">
            {(report.tags || []).map((tag) => (
              <span key={tag} className="badge badge-accent">{tag}</span>
            ))}
          </div>

          {report.description && (
            <div className="detail-section">
              <div className="detail-eyebrow">Description</div>
              <p className="detail-text">{report.description}</p>
            </div>
          )}

          {report.facts && (
            <div className="detail-section">
              <div className="detail-grid-3">
                {Object.entries(report.facts).map(([k, v]) => (
                  <div key={k}>
                    <div className="detail-key">{labelize(k)}</div>
                    <div className="detail-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-attach-row">
            {report.photo && (
              <div className="attach-tile">
                <div className="attach-thumb" />
                <div className="attach-foot">
                  <span>{report.photo.name} · {report.photo.size}</span>
                  <a href="#open">Open</a>
                </div>
              </div>
            )}
            <DetailLocationMap report={report} />
          </div>
        </div>

        <div>
          {report.routing && (
            <div className="detail-side-card">
              <div className="detail-side-title">
                <span>{report.routing.title}</span>
                <span className="badge badge-accent">{report.routing.rule}</span>
              </div>
              <p className="detail-side-meta">{report.routing.destination}</p>
              <div className="detail-side-actions">
                <button className="btn btn-ghost" onClick={() => navigate("/agency/routing")}>
                  Edit routing
                </button>
                <button className="btn btn-ghost" onClick={() => navigate("/agency/routing")}>
                  View rule
                </button>
              </div>
            </div>
          )}

          <div className="detail-side-card">
            <div className="detail-side-title">
              <span>Activity</span>
              <span className="preview-meta">{activity.length} events</span>
            </div>
            <div className="activity-list" style={{ marginTop: 14 }}>
              {activity.length === 0 && (
                <div className="detail-side-meta">No activity yet.</div>
              )}
              {activity.map((event, i) => {
                const cfg = ACTIVITY_ICON[event.kind] || ACTIVITY_ICON.note;
                const Icon = cfg.Icon;
                return (
                  <div key={i} className="activity-item">
                    <div className={`activity-icon ${cfg.cls}`}>
                      <Icon size={14} strokeWidth={2.6} />
                    </div>
                    <div>
                      <div className="activity-title">{event.title}</div>
                      <div className="activity-meta">{event.meta}</div>
                    </div>
                    <div className="activity-time">{event.time}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="detail-side-card">
            <div className="detail-eyebrow">Add note</div>
            <textarea
              className="textarea"
              placeholder="Field team dispatched · ETA 40 min…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onPostNote();
                }
              }}
            />
            <div className="note-actions">
              <button className="btn btn-ghost">Attach</button>
              <button
                className="btn btn-primary"
                disabled={!note.trim()}
                onClick={onPostNote}
              >
                Post note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function labelize(key) {
  // signs -> Signs, immediate_danger -> Immediate danger, etc.
  return key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}
