import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowRight, Plus, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import { alertsService } from "../services/dataSources";
import { REPORTS } from "../data/reports";
import { detectClusters } from "../lib/clusters";

const SEVERITIES = ["low", "moderate", "high", "critical"];
const CATEGORIES = ["people", "animal", "environment", "vector"];
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
  const [searchParams] = useSearchParams();

  // Prefill from ?cluster=<id> or ?report=<id> if present.
  const prefill = useMemo(() => derivePrefill(searchParams), [searchParams]);

  const [form, setForm] = useState(() => ({
    title: "",
    severity: "moderate",
    category: "vector",
    target: "",
    message: "",
    actions: [...DEFAULT_ACTIONS],
    channels: ["Web", "SMS", "Email"],
    linkedReports: [],
    ...prefill,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-save draft to localStorage once per change, debounced.
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem("alert-draft", JSON.stringify(form));
    }, 600);
    return () => clearTimeout(t);
  }, [form]);

  // Restore any draft on first mount, unless ?cluster=/report= overrides.
  useEffect(() => {
    if (Object.keys(prefill).length > 0) return;
    const saved = localStorage.getItem("alert-draft");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setForm((f) => ({ ...f, ...parsed }));
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleChannel = (c) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c)
        ? f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    }));
  };

  const removeAction = (a) => {
    setForm((f) => ({ ...f, actions: f.actions.filter((x) => x !== a) }));
  };

  const addAction = () => {
    const text = window.prompt("New recommended action:");
    if (!text || !text.trim()) return;
    setForm((f) => ({ ...f, actions: [...f.actions, text.trim()] }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.message.trim()) e.message = "Message is required";
    if (!form.channels.length) e.channels = "Choose at least one channel";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveDraft = async () => {
    setDraftSaving(true);
    localStorage.setItem("alert-draft", JSON.stringify(form));
    await new Promise((r) => setTimeout(r, 220));
    setDraftSaving(false);
    toast.success("Draft saved");
  };

  const send = async () => {
    if (!validate()) {
      toast.error("Fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      await alertsService.create({
        title: form.title,
        description: form.message,
        severity: form.severity,
        category: form.category,
        target: form.target,
        message: form.message,
        channels: form.channels,
        actions: form.actions,
        linked_reports: form.linkedReports,
      });
      toast.success("Alert sent");
      localStorage.removeItem("alert-draft");
      navigate("/agency/alerts");
    } catch (err) {
      toast.error(err?.message || "Couldn't send alert");
    } finally {
      setSubmitting(false);
    }
  };

  const smsPreview = buildSmsPreview(form);
  const smsLen = smsPreview.length;
  const smsOver = smsLen > SMS_LIMIT;

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
          <button className="btn btn-ghost" onClick={saveDraft} disabled={draftSaving}>
            <Save size={14} strokeWidth={2.2} />
            {draftSaving ? "Saving…" : "Save draft"}
          </button>
          <button className="btn btn-primary" onClick={send} disabled={submitting}>
            {submitting ? "Sending…" : "Review & send"}
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
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Short, actionable headline"
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Severity</div>
              <select
                className="select"
                value={form.severity}
                onChange={(e) => update({ severity: e.target.value })}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{capitalize(s)}</option>
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
                onChange={(e) => update({ category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{capitalize(c)}</option>
                ))}
              </select>
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Target ZIPs or area</div>
              <input
                className="input"
                value={form.target}
                onChange={(e) => update({ target: e.target.value })}
                placeholder="85719 · 85705 · 85745"
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
              rows={5}
              value={form.message}
              onChange={(e) => update({ message: e.target.value })}
              placeholder="What is happening, who is affected, what should people do?"
            />
            {errors.message && <div className="form-error">{errors.message}</div>}
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Recommended actions</div>
            <div className="composer-chip-row">
              {form.actions.map((a) => (
                <span key={a} className="composer-chip is-active">
                  {a}
                  <button
                    type="button"
                    className="composer-chip-x"
                    onClick={() => removeAction(a)}
                    aria-label={`Remove ${a}`}
                  >
                    <X size={10} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
              <button type="button" className="composer-chip composer-chip--add" onClick={addAction}>
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
              {form.message || "Compose your message to see the email preview…"}
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

function derivePrefill(searchParams) {
  const out = {};
  const reportId = searchParams.get("report");
  const clusterId = searchParams.get("cluster");

  if (reportId) {
    const r = REPORTS.find((x) => x.id === reportId);
    if (r) {
      out.title = `${r.category} report · ${r.summary}`;
      out.category = r.categorySlug === "env" ? "environment" : r.categorySlug === "people" ? "people" : r.categorySlug;
      out.linkedReports = [r.id];
      out.target = r.location?.zip || "";
    }
  }

  if (clusterId) {
    const cluster = detectClusters(REPORTS).find((c) => c.id === clusterId);
    if (cluster) {
      out.title = `${cluster.count} ${cluster.category.toLowerCase()} reports — emerging cluster`;
      out.category = cluster.categorySlug === "env" ? "environment" : cluster.categorySlug;
      out.linkedReports = cluster.memberIds;
    }
  }

  return out;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
