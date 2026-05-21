import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, ArrowRight, Plus, ChevronLeft } from "lucide-react";
import { alertsService } from "../services/alertsService";

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];
const STATUSES = ["open", "review", "resolved"];
const CATEGORIES = ["People", "Animal", "Environment", "Vector"];
const CHANNELS = ["Web", "SMS", "Email", "Printable flyer", "Social copy"];

const DEFAULT_ACTIONS = [
  "Drain standing water",
  "Use EPA-approved repellent",
  "Cover sleeping areas",
];

function normalizeSeverity(s) {
  const map = {
    low: "Low",
    medium: "Moderate",
    high: "High",
    critical: "Critical",
  };
  return map[s] || s;
}

function normalizeCategory(c) {
  const map = {
    people: "People",
    animal: "Animal",
    environment: "Environment",
    vector: "Vector",
  };
  return map[c] || c;
}

function normalizeChannel(c) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export default function EditAlertPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const alert = alertsService.getById(Number(id));
    if (!alert) {
      navigate("/agency/alerts");
      return;
    }

    setForm({
      title: alert.title,
      severity: normalizeSeverity(alert.severity),
      status: alert.status,
      category: normalizeCategory(alert.category),
      target: alert.targetLocations?.join(" · ") || "",
      message: alert.description,
      actions: alert.recommendedActions || DEFAULT_ACTIONS,
      channels: (alert.channels || []).map(normalizeChannel),
    });
    setLoading(false);
  }, [id, navigate]);

  const toggleChannel = (c) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c)
        ? f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const targetLocations = form.target
        .split(/[·,]/)
        .map((z) => z.trim())
        .filter((z) => z);

      const severityMap = {
        Low: "low",
        Moderate: "medium",
        High: "high",
        Critical: "critical",
      };

      const categoryMap = {
        People: "people",
        Animal: "animal",
        Environment: "environment",
        Vector: "vector",
      };

      const normalizedChannels = form.channels.map((c) => c.toLowerCase());

      const alertData = {
        severity: severityMap[form.severity] || "medium",
        status: form.status,
        category: categoryMap[form.category] || "people",
        title: form.title,
        description: form.message,
        targetLocations,
        recommendedActions: form.actions,
        channels: normalizedChannels,
      };

      alertsService.update(Number(id), alertData);
      navigate("/agency/alerts");
    } catch (error) {
      console.error("Error saving alert:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading alert…</div>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <div>
      <div className="console-header">
        <div>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/agency/alerts")}
            style={{ marginBottom: 12 }}
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <h1 className="console-title">Edit alert</h1>
          <p className="console-subtitle">Make changes and save</p>
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
          <button className="btn btn-ghost">Discard</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
            <ArrowRight size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="composer-grid">
        <div>
          <div className="composer-row">
            <div className="composer-block">
              <div className="detail-eyebrow">Title</div>
              <input
                className="input"
                placeholder="e.g., Heat advisory — Southern Arizona"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Severity</div>
              <select
                className="select"
                value={form.severity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, severity: e.target.value }))
                }
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Status</div>
              <select
                className="select"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="composer-row">
            <div className="composer-block">
              <div className="detail-eyebrow">Category</div>
              <select
                className="select"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Target</div>
              <input
                className="input"
                placeholder="e.g., 85701 · 85702 · 85703"
                value={form.target}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Message</div>
            <textarea
              className="textarea"
              placeholder="Provide clear, actionable information for the public. Include what to do, who should respond, and any relevant links."
              rows={5}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
            />
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Recommended actions</div>
            <div className="composer-chip-row">
              {form.actions.map((a) => (
                <span key={a} className="composer-chip is-active">
                  {a}
                </span>
              ))}
              <button
                type="button"
                className="composer-chip composer-chip--add"
              >
                <Plus size={12} /> add
              </button>
            </div>
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Channels</div>
            <div className="composer-chip-row">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`composer-chip ${form.channels.includes(c) ? "is-active" : ""}`}
                  onClick={() => toggleChannel(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">SMS preview</span>
              <span className="preview-meta">≤ 160 chars</span>
            </div>
            <div className="preview-body">
              [One Health AZ] {form.title.substring(0, 80)}...
            </div>
          </div>

          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">Email preview</span>
              <span className="preview-meta">Spanish auto-translated</span>
            </div>
            <div className="preview-email-title">{form.title}</div>
            <div className="preview-email-body">
              {form.message.substring(0, 140)}...
            </div>
            <div className="preview-pill-row">
              <span className="preview-pill">
                {form.actions.length} actions
              </span>
              <span className="preview-pill">Map link</span>
              <span className="preview-pill">ES version</span>
            </div>
          </div>

          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">Printable flyer</span>
            </div>
            <div className="flyer-canvas">1-page flyer · EN / ES</div>
          </div>
        </div>
      </div>
    </div>
  );
}
