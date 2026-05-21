import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Plus } from "lucide-react";
import { alertsService } from "../services/alertsService";

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];
const STATUSES = ["open", "review", "resolved"];
const CATEGORIES = ["People", "Animal", "Environment", "Vector"];
const CHANNELS = ["Web", "SMS", "Email", "Printable flyer", "Social copy"];
const SMS_LIMIT = 160;

const DEFAULT_ACTIONS = [
  "Drain standing water",
  "Use EPA-approved repellent",
  "Cover sleeping areas",
];

// SMS preview: brand prefix + an honest summary built from the message.
function buildSmsPreview(form) {
  const prefix = "[One Health AZ]";
  const body = (form.message || "").replace(/\s+/g, " ").trim();
  if (!body) return `${prefix} Draft an alert message to preview here.`;
  // Naive trim to fit ~140 chars after the prefix + URL placeholder.
  const room = SMS_LIMIT - prefix.length - 1 - " Info: oh.az/alerts".length - 4;
  const trimmed = body.length > room ? `${body.slice(0, room - 1)}…` : body;
  return `${prefix} ${trimmed} Info: oh.az/alerts`;
}

export default function AlertComposerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    severity: "Moderate",
    status: "open",
    category: "People",
    target: "",
    message: "",
    actions: DEFAULT_ACTIONS,
    channels: ["Web"],
    linkedReports: [],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const smsPreview = useMemo(() => buildSmsPreview(form), [form]);
  const smsLen = smsPreview.length;
  const smsOver = smsLen > SMS_LIMIT;

  const toggleChannel = (c) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c)
        ? f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    }));
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Add a title before sending.";
    if (!form.message.trim()) nextErrors.message = "Add a message for the public.";
    if (form.channels.length === 0) nextErrors.channels = "Choose at least one delivery channel.";
    if (smsOver && form.channels.includes("SMS")) {
      nextErrors.message = `SMS copy needs to stay within ${SMS_LIMIT} characters.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      setErrors({});

      // Parse target locations from the string (split by · or ,)
      const targetLocations = form.target
        .split(/[·,]/)
        .map((z) => z.trim())
        .filter((z) => z);

      // Normalize severity to lowercase
      const severityMap = {
        Low: "low",
        Moderate: "medium",
        High: "high",
        Critical: "critical",
      };

      // Normalize category to lowercase
      const categoryMap = {
        People: "people",
        Animal: "animal",
        Environment: "environment",
        Vector: "vector",
      };

      // Normalize channels to lowercase
      const normalizedChannels = form.channels.map((c) => c.toLowerCase());

      // Create alert object
      const alertData = {
        severity: severityMap[form.severity] || "medium",
        status: form.status,
        category: categoryMap[form.category] || "people",
        title: form.title,
        description: form.message,
        targetLocations,
        recommendedActions: form.actions,
        channels: normalizedChannels,
        linkedReports: form.linkedReports,
      };

      // Save using the service
      alertsService.add(alertData);

      // Navigate back to alerts page
      navigate("/agency/alerts");
    } catch (error) {
      console.error("Error saving alert:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">New public alert</h1>
          <p className="console-subtitle">
            Draft · auto-saved {form.linkedReports.length > 0 && `· linked to ${form.linkedReports.length} report${form.linkedReports.length === 1 ? "" : "s"}`}
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
          <button className="btn btn-ghost">Save draft</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Review & send"}
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
              {errors.title && <div className="form-error">{errors.title}</div>}
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
              <div className="detail-eyebrow">Target ZIPs or area</div>
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
            <div className="composer-row" style={{ marginBottom: 0, gridTemplateColumns: "1fr auto" }}>
              <div className="detail-eyebrow">Message</div>
              <div className={`detail-eyebrow ${smsOver ? "form-error-inline" : ""}`}>
                {smsLen} / {SMS_LIMIT} SMS chars
              </div>
            </div>
            <textarea
              className="textarea"
              placeholder="Provide clear, actionable information for the public. Include what to do, who should respond, and any relevant links."
              rows={5}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
            />
            {errors.message && <div className="form-error">{errors.message}</div>}
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
            {errors.channels && <div className="form-error">{errors.channels}</div>}
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Linked reports</div>
            {form.linkedReports.length === 0 ? (
              <p className="detail-side-meta">No reports linked. Link from a report detail or cluster view.</p>
            ) : (
              <p className="detail-side-meta">{form.linkedReports.join(" · ")}</p>
            )}
          </div>
        </div>

        <div>
          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">SMS preview</span>
              <span className={`preview-meta ${smsOver ? "form-error-inline" : ""}`}>
                ≤ {SMS_LIMIT} chars
              </span>
            </div>
            <div className="preview-body">{smsPreview}</div>
          </div>

          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">Email preview</span>
              <span className="preview-meta">Spanish auto-translated</span>
            </div>
            <div className="preview-email-title">{form.title || "Untitled alert"}</div>
            <div className="preview-email-body">
              Hello — public health partners are seeing more mosquito activity
              in NW Pima this week. A few simple steps can help…
            </div>
            <div className="preview-pill-row">
              <span className="preview-pill">{form.actions.length} actions</span>
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
