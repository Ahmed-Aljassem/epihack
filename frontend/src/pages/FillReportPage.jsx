import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Image as ImageIcon,
  Frown,
  Smile,
} from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

const SYMPTOMS = [
  { id: "cough", label: "Cough", icon: "❄️" },
  { id: "fever", label: "Fever", icon: "🌡️" },
  { id: "very_tired", label: "Very Tired", icon: "😴" },
  { id: "nausea", label: "Nausea", icon: "💧" },
  { id: "headache", label: "Headache", icon: "🧠" },
  { id: "body_aches", label: "Body Aches", icon: "🦴" },
  { id: "sore_throat", label: "Sore Throat", icon: "😣" },
  { id: "other", label: "Other", icon: "➕" },
];

const CATEGORIES = [
  {
    id: "people",
    label: "People",
    description: "Yourself, family, or friends",
  },
  {
    id: "animals",
    label: "Animals",
    description: "Pets, farm animals, or wildlife",
  },
  {
    id: "environment",
    label: "Environment",
    description: "Water, air, plants, or places",
  },
];

const SYMPTOM_START_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
];

const DIAGNOSIS_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "no_doctor", label: "Haven't seen a doctor" },
];

const SEVERITY_OPTIONS = [
  { id: "mild", label: "Mild" },
  { id: "moderate", label: "Moderate" },
  { id: "severe", label: "Severe" },
];

export default function FillReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    feeling: null, // "sick" or "good"
    categories: [],
    symptoms: [],
    sickCount: 1,
    location: "",
    photo: null,
    symptomStart: null,
    diagnosis: null,
    severity: null,
  });

  const handleFeeling = (feeling) => {
    setFormData({ ...formData, feeling });
  };

  const toggleCategory = (categoryId) => {
    setFormData({
      ...formData,
      categories: formData.categories.includes(categoryId)
        ? formData.categories.filter((id) => id !== categoryId)
        : [...formData.categories, categoryId],
    });
  };

  const toggleSymptom = (symptomId) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.includes(symptomId)
        ? formData.symptoms.filter((id) => id !== symptomId)
        : [...formData.symptoms, symptomId],
    });
  };

  const updateSickCount = (count) => {
    setFormData({ ...formData, sickCount: Math.max(1, count) });
  };

  const handleLocationChange = (e) => {
    setFormData({ ...formData, location: e.target.value });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, photo: e.target.files[0] });
    }
  };

  const canProceedStep1 = formData.feeling && formData.categories.length > 0;
  const canProceedStep2 = formData.symptoms.length > 0 && formData.location;
  const canProceedStep3 =
    formData.symptomStart && formData.diagnosis && formData.severity;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Submit form data to backend
    navigate("/report/sent");
  };

  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <section className="report-form-container">
          <div className="report-form-header">
            <Link to="/" className="btn btn-ghost-inline">
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back
            </Link>
            <div className="report-form-progress">Step {step} of 3</div>
          </div>

          <form className="report-form">
            {/* Step 1: Feeling & Categories */}
            {step === 1 && (
              <div className="report-form-step">
                <div className="report-form-step-content">
                  <h2>How are you feeling today?</h2>
                  <p className="report-form-subtitle">
                    Your report helps Arizona detect health threats early.
                  </p>

                  <div className="feeling-buttons">
                    <button
                      type="button"
                      className={`feeling-btn ${formData.feeling === "sick" ? "active" : ""}`}
                      onClick={() => handleFeeling("sick")}
                    >
                      <Frown size={32} />
                      <span>Feeling Sick</span>
                    </button>
                    <button
                      type="button"
                      className={`feeling-btn ${formData.feeling === "good" ? "active" : ""}`}
                      onClick={() => handleFeeling("good")}
                    >
                      <Smile size={32} />
                      <span>Feeling Good</span>
                    </button>
                  </div>

                  <div className="form-section">
                    <h3>What is this about?</h3>
                    <div className="category-grid">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`category-card ${formData.categories.includes(cat.id) ? "selected" : ""}`}
                          onClick={() => toggleCategory(cat.id)}
                        >
                          <div className="category-card-content">
                            <div className="category-card-title">
                              {cat.label}
                            </div>
                            <div className="category-card-description">
                              {cat.description}
                            </div>
                          </div>
                          <div
                            className={`category-checkmark ${formData.categories.includes(cat.id) ? "visible" : ""}`}
                          >
                            ✓
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="report-form-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canProceedStep1}
                    onClick={handleNext}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Symptoms & Details */}
            {step === 2 && (
              <div className="report-form-step">
                <div className="report-form-step-content">
                  <h2>What symptoms are you having?</h2>
                  <p className="report-form-subtitle">Select all that apply.</p>

                  <div className="symptoms-grid">
                    {SYMPTOMS.map((symptom) => (
                      <button
                        key={symptom.id}
                        type="button"
                        className={`symptom-btn ${formData.symptoms.includes(symptom.id) ? "selected" : ""}`}
                        onClick={() => toggleSymptom(symptom.id)}
                      >
                        <span className="symptom-icon">{symptom.icon}</span>
                        <span>{symptom.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="form-section">
                    <h3>How many people are sick?</h3>
                    <div className="count-input">
                      <button
                        type="button"
                        onClick={() => updateSickCount(formData.sickCount - 1)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={formData.sickCount}
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => updateSickCount(formData.sickCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Where are you located?</h3>
                    <div className="location-input">
                      <MapPin size={18} />
                      <input
                        type="text"
                        placeholder="Enter zip code"
                        value={formData.location}
                        onChange={handleLocationChange}
                      />
                      <button type="button" className="btn-text">
                        Detect
                      </button>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Optional photo</h3>
                    <label className="photo-upload">
                      <ImageIcon size={20} />
                      <span>Tap to add photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        hidden
                      />
                    </label>
                    {formData.photo && (
                      <p className="photo-name">{formData.photo.name}</p>
                    )}
                  </div>
                </div>

                <div className="report-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canProceedStep2}
                    onClick={handleNext}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Final Details */}
            {step === 3 && (
              <div className="report-form-step">
                <div className="report-form-step-content">
                  <h2>A few more details</h2>
                  <p className="report-form-subtitle">
                    This helps our analysis.
                  </p>

                  <div className="form-section">
                    <h3>When did symptoms start?</h3>
                    <div className="button-group">
                      {SYMPTOM_START_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`btn-option ${formData.symptomStart === opt.id ? "selected" : ""}`}
                          onClick={() =>
                            setFormData({ ...formData, symptomStart: opt.id })
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Were you professionally diagnosed?</h3>
                    <div className="button-group">
                      {DIAGNOSIS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`btn-option ${formData.diagnosis === opt.id ? "selected" : ""}`}
                          onClick={() =>
                            setFormData({ ...formData, diagnosis: opt.id })
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Severity</h3>
                    <div className="button-group">
                      {SEVERITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`btn-option ${formData.severity === opt.id ? "selected" : ""}`}
                          onClick={() =>
                            setFormData({ ...formData, severity: opt.id })
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="report-form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canProceedStep3}
                    onClick={handleSubmit}
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
