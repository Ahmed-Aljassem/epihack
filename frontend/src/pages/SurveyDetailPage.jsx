import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSurvey, useMutation } from "../hooks/useData";
import { responsesAPI } from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Send } from "lucide-react";

function QuestionField({ question, value, onChange }) {
  const { id, text, type, options, required, min_value, max_value } = question;

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
              <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={checked} onChange={toggle} />
                {o.label}
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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
            <span>{min_value ?? 1}</span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>{value || "—"}</span>
            <span>{max_value ?? 10}</span>
          </div>
        </div>
      );

    case "date":
      return <input type="date" className="input" {...props} />;

    default: // text
      return <textarea className="textarea" {...props} placeholder="Your answer…" />;
  }
}

export default function SurveyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: survey, loading } = useSurvey(id);
  const [answers, setAnswers] = useState({});

  const { mutate: submit, loading: submitting } = useMutation(
    () => responsesAPI.submit({
      survey_id: id,
      answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
    }),
    {
      successMessage: "Response submitted — thank you for participating!",
      onSuccess: () => navigate("/agency/my-responses"),
    }
  );

  if (loading) return <div className="loading-screen">Loading survey…</div>;
  if (!survey) return <div style={{ color: "var(--muted)" }}>Survey not found.</div>;

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
    <div style={{ maxWidth: 680 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 20, fontSize: 12 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className={`badge badge-${survey.category}`}>{survey.category}</span>
          {survey.tags?.map((t) => (
            <span key={t} style={{ fontSize: 11, color: "var(--muted)" }}>#{t}</span>
          ))}
        </div>
        <h1 className="page-title">{survey.title}</h1>
        <p className="page-subtitle" style={{ marginTop: 6 }}>{survey.description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {survey.questions.map((q, i) => (
            <div key={q.id} className="card">
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>Q{i + 1}</span>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>
                  {q.text}
                  {q.required && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
                </div>
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
          style={{ marginTop: 24, width: "100%", justifyContent: "center", padding: "12px" }}
        >
          <Send size={15} />
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
