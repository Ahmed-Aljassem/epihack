import { useState } from "react";
import { Search, ArrowRight, Plus } from "lucide-react";

const SEVERITIES = ["Low", "Moderate", "High", "Critical"];
const CATEGORIES = ["People", "Animal", "Environment", "Vector"];
const CHANNELS = ["Web", "SMS", "Email", "Printable flyer", "Social copy"];

const DEFAULT_ACTIONS = [
  "Drain standing water",
  "Use EPA-approved repellent",
  "Cover sleeping areas",
];

const LINKED = ["RPT-1022", "RPT-1014", "RPT-1009"];

export default function AlertComposerPage() {
  const [form, setForm] = useState({
    title: "Mosquito activity rising — drain standing water",
    severity: "Moderate",
    category: "Vector",
    target: "85719 · 85705 · 85745",
    message:
      "Mosquito activity is rising in NW Pima. Drain standing water around your home. Use repellent at dawn and dusk. If a household member has fever + rash, contact your provider.",
    actions: DEFAULT_ACTIONS,
    channels: ["Web", "SMS", "Email"],
  });

  const toggleChannel = (c) => {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c)
        ? f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    }));
  };

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">New public alert</h1>
          <p className="console-subtitle">Draft · auto-saved</p>
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
          <button className="btn btn-primary">
            Review &amp; send
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
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Severity</div>
              <select
                className="select"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="composer-block">
              <div className="detail-eyebrow">Target</div>
              <input
                className="input"
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
              />
            </div>
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Message</div>
            <textarea
              className="textarea"
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>

          <div className="composer-block">
            <div className="detail-eyebrow">Recommended actions</div>
            <div className="composer-chip-row">
              {form.actions.map((a) => (
                <span key={a} className="composer-chip is-active">{a}</span>
              ))}
              <button type="button" className="composer-chip composer-chip--add">
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

          <div className="composer-block">
            <div className="detail-eyebrow">Linked reports</div>
            <p className="detail-side-meta">
              {LINKED.join(" · ")} · 5 more from the last 14 days
            </p>
          </div>
        </div>

        <div>
          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">SMS preview</span>
              <span className="preview-meta">≤ 160 chars</span>
            </div>
            <div className="preview-body">
              [One Health AZ] Mosquito activity ↑ in NW Pima. Drain standing water,
              use repellent dawn/dusk. Fever+rash? Contact a provider. Info: oh.az/alerts/24
            </div>
          </div>

          <div className="preview-block">
            <div className="preview-head">
              <span className="preview-title">Email preview</span>
              <span className="preview-meta">Spanish auto-translated</span>
            </div>
            <div className="preview-email-title">{form.title}</div>
            <div className="preview-email-body">
              Hello — public health partners are seeing more mosquito activity in
              NW Pima this week. A few simple steps can help…
            </div>
            <div className="preview-pill-row">
              <span className="preview-pill">3 actions</span>
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
