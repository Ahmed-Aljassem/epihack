import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, CheckCircle2, X, Smartphone, Mail, FileText, Globe2 } from "lucide-react";
import toast from "react-hot-toast";
import TagInput from "../components/console/TagInput";
import { alertsService } from "../services/alertsService";

const DRAFT_KEY = "alert-composer-draft";

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

const INITIAL_FORM = {
  title: "",
  severity: "Moderate",
  status: "open",
  category: "People",
  targets: [],
  message: "",
  actions: DEFAULT_ACTIONS,
  channels: ["Web"],
  linkedReports: [],
};

function normalizeZip(raw) {
  const digits = String(raw).replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : null;
}

export default function AlertComposerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return INITIAL_FORM;
      const parsed = JSON.parse(stored);
      const next = { ...INITIAL_FORM, ...parsed };
      // Migrate the older `target: "85701 · 85702"` string into the new array.
      if (!Array.isArray(next.targets)) {
        const seed = typeof parsed.target === "string" ? parsed.target : "";
        next.targets = seed
          .split(/[·,\s]/)
          .map(normalizeZip)
          .filter(Boolean);
      }
      return next;
    } catch {
      return INITIAL_FORM;
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [addingAction, setAddingAction] = useState(false);
  const [newAction, setNewAction] = useState("");

  // Auto-save the draft as the user types (debounced via timeout).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDraftSavedAt(Date.now());
      } catch {
        /* storage unavailable */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [form]);

  const smsPreview = useMemo(() => buildSmsPreview(form), [form]);
  const smsLen = smsPreview.length;
  const smsOver = smsLen > SMS_LIMIT;

  const commitNewAction = () => {
    const trimmed = newAction.trim();
    if (!trimmed) {
      setAddingAction(false);
      setNewAction("");
      return;
    }
    setForm((f) => (
      f.actions.includes(trimmed)
        ? f
        : { ...f, actions: [...f.actions, trimmed] }
    ));
    setNewAction("");
    setAddingAction(false);
  };

  const removeAction = (action) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((a) => a !== action) }));
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setDraftSavedAt(Date.now());
      toast.success("Draft saved");
    } catch {
      toast.error("Couldn't save draft");
    }
  };

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

      const targetLocations = form.targets;

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

      alertsService.add(alertData);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* storage unavailable */
      }
      toast.success("Alert sent");
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
            <span className="composer-status">
              <CheckCircle2 size={13} strokeWidth={2.2} />
              {draftSavedAt ? "Draft auto-saved" : "Draft"}
            </span>
            {form.linkedReports.length > 0 &&
              ` · linked to ${form.linkedReports.length} report${form.linkedReports.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="console-actions">
          <button className="btn btn-ghost" onClick={handleSaveDraft}>
            Save draft
          </button>
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
        <div className="composer-main">
          <section className="composer-section">
            <header className="composer-section-head">
              <h2 className="composer-section-title">Basics</h2>
              <p className="composer-section-sub">
                Headline, urgency, and lifecycle stage.
              </p>
            </header>
            <div className="composer-fields">
              <div className="composer-field composer-field--full">
                <label className="composer-label" htmlFor="alert-title">Title</label>
                <input
                  id="alert-title"
                  className="input"
                  placeholder="e.g., Heat advisory — Southern Arizona"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="composer-field">
                <label className="composer-label" htmlFor="alert-severity">Severity</label>
                <div className="composer-segmented" role="radiogroup" aria-label="Severity">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={form.severity === s}
                      className={`composer-segmented-option ${form.severity === s ? "is-active" : ""} severity-${s.toLowerCase()}`}
                      onClick={() => setForm((f) => ({ ...f, severity: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="composer-field">
                <label className="composer-label" htmlFor="alert-status">Status</label>
                <select
                  id="alert-status"
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
          </section>

          <section className="composer-section">
            <header className="composer-section-head">
              <h2 className="composer-section-title">Audience</h2>
              <p className="composer-section-sub">
                Who this alert applies to and where it should reach.
              </p>
            </header>
            <div className="composer-fields">
              <div className="composer-field">
                <label className="composer-label" htmlFor="alert-category">Category</label>
                <select
                  id="alert-category"
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
              <div className="composer-field">
                <div className="composer-label-row">
                  <label className="composer-label">Target ZIPs</label>
                  {form.targets.length > 0 ? (
                    <button
                      type="button"
                      className="composer-mini-action"
                      onClick={() => setForm((f) => ({ ...f, targets: [] }))}
                    >
                      <Globe2 size={11} strokeWidth={2.2} />
                      Whole state
                    </button>
                  ) : (
                    <span className="composer-mini-flag">
                      <Globe2 size={11} strokeWidth={2.2} />
                      Whole state
                    </span>
                  )}
                </div>
                <TagInput
                  values={form.targets}
                  onChange={(next) => {
                    const cleaned = [];
                    const seen = new Set();
                    next.forEach((raw) => {
                      const zip = normalizeZip(raw);
                      if (zip && !seen.has(zip)) {
                        seen.add(zip);
                        cleaned.push(zip);
                      }
                    });
                    setForm((f) => ({ ...f, targets: cleaned }));
                  }}
                  placeholder="Type a 5-digit ZIP and press Enter"
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  helpText={
                    form.targets.length === 0
                      ? "Empty list targets every ZIP in the state."
                      : `${form.targets.length} ZIP${form.targets.length === 1 ? "" : "s"} selected.`
                  }
                />
              </div>
            </div>
          </section>

          <section className="composer-section">
            <header className="composer-section-head">
              <h2 className="composer-section-title">Message</h2>
              <p className="composer-section-sub">
                Clear, actionable copy the public will read first.
              </p>
            </header>
            <div className="composer-field composer-field--full">
              <div className="composer-label-row">
                <label className="composer-label" htmlFor="alert-message">Body</label>
                <span className={`composer-counter ${smsOver ? "is-over" : ""}`}>
                  {smsLen} / {SMS_LIMIT} SMS chars
                </span>
              </div>
              <textarea
                id="alert-message"
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
            <div className="composer-field composer-field--full">
              <label className="composer-label">Recommended actions</label>
              <div className="composer-chip-row">
                {form.actions.map((a) => (
                  <span key={a} className="composer-chip composer-chip--removable is-active">
                    {a}
                    <button
                      type="button"
                      className="composer-chip-remove"
                      onClick={() => removeAction(a)}
                      aria-label={`Remove ${a}`}
                    >
                      <X size={11} strokeWidth={2.4} />
                    </button>
                  </span>
                ))}
                {addingAction ? (
                  <input
                    autoFocus
                    type="text"
                    className="composer-chip-input"
                    placeholder="Type an action and press Enter"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    onBlur={commitNewAction}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitNewAction();
                      } else if (e.key === "Escape") {
                        setNewAction("");
                        setAddingAction(false);
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="composer-chip composer-chip--add"
                    onClick={() => setAddingAction(true)}
                  >
                    <Plus size={12} strokeWidth={2.4} /> add
                  </button>
                )}
              </div>
              <span className="composer-help">
                Short, scannable steps. These appear in every channel under the alert body.
              </span>
            </div>
          </section>

          <section className="composer-section">
            <header className="composer-section-head">
              <h2 className="composer-section-title">Delivery</h2>
              <p className="composer-section-sub">
                Pick the channels and link any related reports.
              </p>
            </header>
            <div className="composer-field composer-field--full">
              <label className="composer-label">Channels</label>
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
            <div className="composer-field composer-field--full">
              <label className="composer-label">Linked reports</label>
              {form.linkedReports.length === 0 ? (
                <p className="composer-help">
                  No reports linked. Link from a report detail or cluster view.
                </p>
              ) : (
                <p className="composer-help">{form.linkedReports.join(" · ")}</p>
              )}
            </div>
          </section>
        </div>

        <aside className="composer-preview">
          <div className="composer-preview-sticky">
            <div className="preview-block">
              <div className="preview-head">
                <span className="preview-title">
                  <Smartphone size={14} strokeWidth={2} />
                  SMS
                </span>
                <span className={`preview-meta ${smsOver ? "form-error-inline" : ""}`}>
                  {smsLen} / {SMS_LIMIT}
                </span>
              </div>
              <div className="sms-phone">
                <div className="sms-phone-bar">
                  <span className="sms-phone-dot" />
                  <span className="sms-phone-time">now</span>
                </div>
                <div className="sms-bubble">{smsPreview}</div>
              </div>
            </div>

            <div className="preview-block">
              <div className="preview-head">
                <span className="preview-title">
                  <Mail size={14} strokeWidth={2} />
                  Email
                </span>
                <span className="preview-meta">Spanish auto-translated</span>
              </div>
              <div className="email-card">
                <div className="email-card-head">
                  <span className="email-card-sender">One Health AZ</span>
                  <span className="email-card-time">now</span>
                </div>
                <div className="email-card-title">
                  {form.title || "Untitled alert"}
                </div>
                <div className="email-card-body">
                  {form.message
                    ? form.message
                    : "Hello — public health partners are seeing more activity in your area this week. A few simple steps can help…"}
                </div>
                <div className="preview-pill-row">
                  <span className="preview-pill">{form.actions.length} action{form.actions.length === 1 ? "" : "s"}</span>
                  <span className="preview-pill">Map link</span>
                  <span className="preview-pill">ES version</span>
                </div>
              </div>
            </div>

            <div className="preview-block">
              <div className="preview-head">
                <span className="preview-title">
                  <FileText size={14} strokeWidth={2} />
                  Printable flyer
                </span>
                <span className="preview-meta">EN / ES</span>
              </div>
              <div className="flyer-canvas">
                <div className="flyer-canvas-page">
                  <div className="flyer-canvas-bar" />
                  <div className="flyer-canvas-bar flyer-canvas-bar--short" />
                  <div className="flyer-canvas-block" />
                  <div className="flyer-canvas-block flyer-canvas-block--small" />
                </div>
                <span className="flyer-canvas-label">1-page handout</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
