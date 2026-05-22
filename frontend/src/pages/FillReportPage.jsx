/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Collect public One Health signal reports using category-aware
questions so symptoms and field parameters match people, animal, and
environment contexts.
*/

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Image as ImageIcon,
  Frown,
  Smile,
  Wind,
  Thermometer,
  Moon,
  Droplet,
  Droplets,
  Brain,
  Bone,
  Mic,
  AlertTriangle,
  PawPrint,
  Leaf,
  CloudSun,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import PublicHeader from "../components/public/PublicHeader";

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

const PEOPLE_SIGNAL_OPTIONS = [
  { id: "no_symptoms", label: "No symptoms", Icon: Smile, color: "#4f6dde" },
  { id: "symptoms_present", label: "Symptoms present", Icon: AlertTriangle, color: "#2e7f65" },
  { id: "cough_congestion", label: "Cough / congestion", Icon: Wind, color: "#5d8a9b" },
  { id: "nausea_vomiting", label: "Nausea / vomiting", Icon: Droplet, color: "#3f8a8a" },
  { id: "difficulty_breathing", label: "Difficulty breathing", Icon: Wind, color: "#3d7e9e" },
  { id: "sore_throat", label: "Sore throat", Icon: Mic, color: "#5a8d70" },
  { id: "rash", label: "Rash", Icon: Droplets, color: "#9b6a8a" },
  { id: "fever", label: "Fever", Icon: Thermometer, color: "#c1574e" },
  { id: "chills", label: "Chills", Icon: Moon, color: "#7b6aa3" },
  { id: "diarrhea", label: "Diarrhea", Icon: Droplets, color: "#5f8d98" },
  { id: "red_eyes", label: "Red eyes", Icon: Brain, color: "#8c5f8e" },
  { id: "body_aches", label: "Body aches / pain", Icon: Bone, color: "#b58955" },
  { id: "loss_smell_taste", label: "Loss of smell or taste", Icon: Frown, color: "#4d6c91" },
  { id: "bleeding_from_openings", label: "Bleeding from body openings", Icon: AlertTriangle, color: "#ba4f52" },
  { id: "bloody_urine", label: "Discolored or bloody urine", Icon: Droplet, color: "#8e5c7a" },
  { id: "yellow_skin_eyes", label: "Yellow skin / yellow eyes", Icon: CloudSun, color: "#b78d2c" },
];

const ANIMAL_SIGNAL_OPTIONS = [
  { id: "animal_sick", label: "Sick animals observed", Icon: PawPrint, color: "#1f8f66" },
  { id: "animal_dead", label: "Dead animals observed", Icon: Bone, color: "#9f6a46" },
  { id: "wildlife_incident", label: "Wildlife incident", Icon: PawPrint, color: "#6f58b4" },
  { id: "livestock_incident", label: "Livestock incident", Icon: PawPrint, color: "#2e7c5d" },
  { id: "animal_bite_exposure", label: "Animal bite exposure", Icon: AlertTriangle, color: "#c86856" },
];

const ENVIRONMENT_SIGNAL_OPTIONS = [
  { id: "environmental_incident", label: "Environmental incident", Icon: Leaf, color: "#3e8b5f" },
  { id: "vector_spotting", label: "Location of vector spotting", Icon: MapPin, color: "#4e7e88" },
  { id: "unusual_vectors", label: "Unusual vector presence", Icon: Wind, color: "#2a8f7a" },
  { id: "vector_density", label: "High vector density", Icon: CloudSun, color: "#c27d4e" },
  { id: "flooding", label: "Flooding", Icon: Droplets, color: "#4d7cc2" },
  { id: "water_contamination", label: "Water contamination", Icon: Droplets, color: "#347e8c" },
];

const CATEGORY_SIGNAL_OPTIONS = {
  people: PEOPLE_SIGNAL_OPTIONS,
  animals: ANIMAL_SIGNAL_OPTIONS,
  environment: ENVIRONMENT_SIGNAL_OPTIONS,
};

function getSignalOptionsForCategories(categories) {
  const activeCategories = categories.length ? categories : ["people"];
  const seen = new Set();
  return activeCategories.flatMap((categoryId) =>
    (CATEGORY_SIGNAL_OPTIONS[categoryId] || []).filter((option) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    }),
  );
}

function getSignalQuestion(categories) {
  const hasPeople = categories.includes("people");
  const hasAnimals = categories.includes("animals");
  const hasEnvironment = categories.includes("environment");

  if (hasPeople && !hasAnimals && !hasEnvironment) {
    return {
      title: "What symptoms are you having?",
      subtitle: "Select all symptoms that apply.",
    };
  }
  if (!hasPeople && hasAnimals && !hasEnvironment) {
    return {
      title: "What animal signs are you seeing?",
      subtitle: "Select all animal signs that apply.",
    };
  }
  if (!hasPeople && !hasAnimals && hasEnvironment) {
    return {
      title: "What environmental signals are you seeing?",
      subtitle: "Select all signals that apply.",
    };
  }
  return {
    title: "What symptoms or signals are you seeing?",
    subtitle: "Select all that apply.",
  };
}

function getAffectedCountPrompt(categories) {
  const hasPeople = categories.includes("people");
  const hasAnimals = categories.includes("animals");
  if (hasPeople && hasAnimals) return "How many people or animals are affected?";
  if (hasAnimals) return "How many animals are affected?";
  return "How many people are affected?";
}

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
    setFormData((current) => {
      if (feeling !== "sick") {
        return { ...current, feeling };
      }
      const categories = current.categories.includes("people")
        ? current.categories
        : ["people", ...current.categories];
      return { ...current, feeling, categories };
    });
  };

  const toggleCategory = (categoryId) => {
    setFormData((current) => {
      const categories = current.categories.includes(categoryId)
        ? current.categories.filter((id) => id !== categoryId)
        : [...current.categories, categoryId];
      const allowedSignals = new Set(
        getSignalOptionsForCategories(categories).map((option) => option.id),
      );
      return {
        ...current,
        categories,
        symptoms: current.symptoms.filter((id) => allowedSignals.has(id)),
      };
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

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location isn't supported on this device");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          if (!res.ok) throw new Error("Lookup failed");
          const data = await res.json();
          const zip = (data.postcode || "").trim();
          if (!/^\d{5}/.test(zip)) {
            toast.error("Couldn't find a ZIP for your location");
            return;
          }
          setFormData((f) => ({ ...f, location: zip.slice(0, 5) }));
          toast.success(`Detected ZIP ${zip.slice(0, 5)}`);
        } catch {
          toast.error("Couldn't look up your ZIP — enter it manually");
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied");
        } else {
          toast.error("Couldn't get your location");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, photo: e.target.files[0] });
    }
  };

  const hasPeopleCategory = formData.categories.includes("people");
  const hasAnimalCategory = formData.categories.includes("animals");
  const signalOptions = useMemo(
    () => getSignalOptionsForCategories(formData.categories),
    [formData.categories],
  );
  const signalQuestion = useMemo(
    () => getSignalQuestion(formData.categories),
    [formData.categories],
  );
  const affectedCountPrompt = useMemo(
    () => getAffectedCountPrompt(formData.categories),
    [formData.categories],
  );

  const requiresAffectedCount = hasPeopleCategory || hasAnimalCategory;
  const requiresHumanFollowups = hasPeopleCategory;

  const canProceedStep1 = formData.feeling && formData.categories.length > 0;
  const canProceedStep2 =
    formData.symptoms.length > 0 &&
    formData.location &&
    (!requiresAffectedCount || formData.sickCount > 0);
  const canProceedStep3 = requiresHumanFollowups
    ? formData.symptomStart && formData.diagnosis && formData.severity
    : true;

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
                  <h2>{signalQuestion.title}</h2>
                  <p className="report-form-subtitle">{signalQuestion.subtitle}</p>

                  <div className="symptoms-grid">
                    {signalOptions.map(({ id, label, Icon, color }) => {
                      const isSelected = formData.symptoms.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`symptom-btn ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleSymptom(id)}
                          style={{ "--symptom-color": color }}
                        >
                          <span className="symptom-icon" aria-hidden="true">
                            <Icon size={22} strokeWidth={1.8} />
                          </span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {requiresAffectedCount && (
                    <div className="form-section">
                      <h3>{affectedCountPrompt}</h3>
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
                  )}

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
                      <button
                        type="button"
                        className="btn-text"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                      >
                        {detectingLocation ? (
                          <>
                            <Loader2 size={14} className="spin" />
                            Detecting...
                          </>
                        ) : (
                          "Detect"
                        )}
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

                  {requiresHumanFollowups ? (
                    <>
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
                    </>
                  ) : (
                    <div className="form-section">
                      <h3>Thanks — category signals captured</h3>
                      <p className="report-form-subtitle">
                        No additional human symptom follow-up is needed for this
                        report type. You can submit now.
                      </p>
                    </div>
                  )}
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
