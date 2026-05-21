import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useSurvey, useMutation } from "../hooks/useData";
import { responsesService } from "../services/dataSources";

function QuestionField({ question, value, onChange }) {
  const { id, type, options, required, min_value, max_value } = question;

  const props = {
    id,
    required,
    onChange: (e) => onChange(id, e.target.value),
    value: value ?? "",
  };

  switch (type) {
    case "boolean":
      return (
        <div style={{ display: "flex", gap: 10 }}>
          {["yes", "no"].map((v) => (
            <button
              key={v}
              type="button"
              className={`btn ${value === v ? "btn-primary" : "btn-ghost"}`}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onChange(id, v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      );

    case "single_choice":
      return (
        <select className="select" {...props}>
          <option value="">Select an option</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );

    case "multi_choice":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options?.map((o) => {
            const checked = Array.isArray(value) && value.includes(o.value);
            const toggle = () => {
              const arr = Array.isArray(value) ? [...value] : [];
              onChange(id, checked ? arr.filter((x) => x !== o.value) : [...arr, o.value]);
            };
            return (
              <label key={o.value} className="multi-check">
                <input type="checkbox" checked={checked} onChange={toggle} />
                <span>{o.label}</span>
              </label>
            );
          })}
        </div>
      );

    case "scale":
      return (
        <div>
          <input
            type="range"
            min={min_value ?? 1} max={max_value ?? 10}
            value={value || min_value || 1}
            onChange={(e) => onChange(id, Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
            <span>{min_value ?? 1}</span>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>{value || "—"}</span>
            <span>{max_value ?? 10}</span>
          </div>
        </div>
      );

    case "date":
      return <input type="date" className="input" {...props} />;

    default:
      return <textarea className="textarea" {...props} placeholder="Your answer…" />;
  }
}

export default function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: survey, loading, error } = useSurvey(id);
  const [answers, setAnswers] = useState({});

  const { mutate: submit, loading: submitting } = useMutation(
    () => responsesService.submit({
      survey_id: id,
      answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
    }),
    {
      successMessage: "Response submitted — thank you for participating!",
      onSuccess: () => navigate("/agency/my-responses"),
    }
  );

  if (loading) {
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="skeleton-block" style={{ height: 80, marginBottom: 14 }} />
        <div className="skeleton-block" style={{ height: 320 }} />
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div>
        <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="empty-state">
          <div className="empty-state-title">
            {error ? "Couldn't load this survey" : "Survey not found"}
          </div>
          <div className="empty-state-copy">
            {error?.message || "It may have been deleted or paused."}
          </div>
        </div>
      </div>
    );
  }

  const handleAnswer = (qId, val) => setAnswers((prev) => ({ ...prev, [qId]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = survey.questions
      .filter((q) => q.required && !answers[q.id])
      .map((q) => q.text);
    if (missing.length) {
      toast.error(`Please answer: ${missing[0]}`);
      return;
    }
    submit();
  };

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back to surveys
      </button>

      <div className="console-header">
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span className={`badge badge-${mapCat(survey.category)}`}>{categoryLabel(survey.category)}</span>
            <span className={`badge ${survey.status === "paused" ? "badge-warn" : "badge-accent"}`}>
              {survey.status || "active"}
            </span>
            <span className="badge">{survey.response_count ?? 0} responses</span>
            {(survey.tags || []).map((t) => (
              <span key={t} className="badge">#{t}</span>
            ))}
          </div>
          <h1 className="console-title">{survey.title}</h1>
          <p className="console-subtitle" style={{ maxWidth: 640 }}>{survey.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {survey.questions.map((q, i) => (
            <div key={q.id} className="card">
              <div className="detail-eyebrow">Question {i + 1}</div>
              <div style={{ fontWeight: 600, fontSize: 15, margin: "6px 0 14px" }}>
                {q.text}
                {q.required && <span style={{ color: "var(--danger)", marginLeft: 6 }}>*</span>}
              </div>
              <QuestionField
                question={q}
                value={answers[q.id]}
                onChange={handleAnswer}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          style={{ marginTop: 20, width: "100%", justifyContent: "center", padding: "12px" }}
        >
          <Send size={15} />
          {submitting ? "Submitting…" : "Submit response"}
        </button>
      </form>
    </div>
  );
}

function mapCat(c) {
  return c === "human" ? "people" : c === "environment" ? "env" : c;
}
function categoryLabel(c) {
  if (c === "human") return "People";
  if (c === "environment") return "Environment";
  if (c === "animal") return "Animal";
  if (c === "vector") return "Vector";
  return c;
}
