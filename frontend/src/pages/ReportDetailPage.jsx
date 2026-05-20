import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search, Check, ArrowUpRight, Paperclip, MapPin,
} from "lucide-react";
import { getReport } from "../data/reports";

const ACTIVITY_ICON = {
  check: { cls: "activity-icon--check", Icon: Check },
  routed: { cls: "activity-icon--routed", Icon: ArrowUpRight },
  note: { cls: "activity-icon--note", Icon: Paperclip },
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const report = getReport(id);
  const [note, setNote] = useState("");

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">
            {report.id} · {report.summary}
          </h1>
          <p className="console-subtitle">
            {report.category} · {report.subcategory || "general"} · {report.location.zip} · {report.location.county} · submitted {report.submitted}
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reports, places, IDs…"
            />
          </div>
          <button className="btn btn-ghost">Reassign</button>
          <button className="btn btn-primary">
            Mark routed
            <Check size={14} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="detail-meta-row">
            {(report.tags || []).map((tag) => (
              <span key={tag} className="badge badge-accent">{tag}</span>
            ))}
          </div>

          <div className="detail-section">
            <div className="detail-eyebrow">Description</div>
            <p className="detail-text">{report.description}</p>
          </div>

          <div className="detail-section">
            <div className="detail-grid-3">
              <div>
                <div className="detail-key">Signs</div>
                <div className="detail-value">{report.facts.signs}</div>
              </div>
              <div>
                <div className="detail-key">Affected</div>
                <div className="detail-value">{report.facts.affected}</div>
              </div>
              <div>
                <div className="detail-key">Immediate danger</div>
                <div className="detail-value">{report.facts.danger}</div>
              </div>
              <div>
                <div className="detail-key">Observed</div>
                <div className="detail-value">{report.facts.observed}</div>
              </div>
              <div>
                <div className="detail-key">Reporter</div>
                <div className="detail-value">{report.facts.reporter}</div>
              </div>
              <div>
                <div className="detail-key">Photo</div>
                <div className="detail-value">{report.facts.photo}</div>
              </div>
            </div>
          </div>

          <div className="detail-attach-row">
            <div className="attach-tile">
              <div className="attach-thumb" />
              <div className="attach-foot">
                <span>{report.photo?.name} · {report.photo?.size}</span>
                <a href="#open">Open</a>
              </div>
            </div>
            <div className="attach-tile">
              <div className="attach-thumb attach-thumb--map">
                <span
                  className="map-dot map-dot--lg"
                  style={{ top: "44%", left: "48%", background: "#3b82f6", opacity: 0.9 }}
                />
              </div>
              <div className="attach-foot">
                <span><MapPin size={12} /> {report.location.coords} · approx.</span>
                <a href="#open">Open in Maps</a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="detail-side-card">
            <div className="detail-side-title">
              <span>{report.routing.title}</span>
              <span className="badge badge-accent">{report.routing.rule}</span>
            </div>
            <p className="detail-side-meta">{report.routing.destination}</p>
            <div className="detail-side-actions">
              <button className="btn btn-ghost">Edit routing</button>
              <button className="btn btn-ghost">View rule</button>
            </div>
          </div>

          <div className="detail-side-card">
            <div className="detail-side-title">
              <span>Activity</span>
              <span className="preview-meta">{report.activity.length} events</span>
            </div>
            <div className="activity-list" style={{ marginTop: 14 }}>
              {report.activity.map((event, i) => {
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
            />
            <div className="note-actions">
              <button className="btn btn-ghost">Attach</button>
              <button
                className="btn btn-primary"
                disabled={!note.trim()}
                onClick={() => setNote("")}
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
