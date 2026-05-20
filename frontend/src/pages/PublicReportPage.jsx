import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  X, ArrowRight, Smile, Thermometer, User, PawPrint, Leaf,
  Bug, Wifi, Plus, MapPin, UploadCloud, Check,
  Circle, Droplet, Wind, MicOff, Scan, Snowflake, AlertTriangle,
  Eye, Activity, FlaskConical, Sun, Briefcase, GraduationCap,
  Stethoscope, Users, HelpCircle, CalendarDays, LocateFixed, Loader2,
  Flame,
} from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";
import {
  FEELING_OPTIONS, REPORT_CATEGORIES, SYMPTOM_OPTIONS,
} from "../data/publicContent";

const CATEGORY_ICONS = {
  user: User, paw: PawPrint, leaf: Leaf,
  bug: Bug, flame: Flame, help: HelpCircle,
};
const SYMPTOM_ICONS = {
  bug: Bug, thermometer: Thermometer, wifi: Wifi, plus: Plus,
  circle: Circle, droplet: Droplet, wind: Wind, "mic-off": MicOff,
  scan: Scan, snowflake: Snowflake, alert: AlertTriangle, eye: Eye,
  activity: Activity, flask: FlaskConical, sun: Sun, briefcase: Briefcase,
  graduation: GraduationCap, stethoscope: Stethoscope, users: Users,
  paw: PawPrint, help: HelpCircle, "map-pin": MapPin,
};
const FEELING_ICONS = { smile: Smile, thermometer: Thermometer };

const TOTAL_STEPS = 3;

const STEP2_TAG_BY_CATEGORY = {
  people:      "Health details",
  animals:     "Animal report",
  environment: "Environment report",
  vector:      "Pest activity",
  hazard:      "Hazard report",
  unsure:      "Tell us more",
};

export default function PublicReportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    feeling: "sick",
    categories: ["people"],
    symptoms: [],
    zip: "",
    dob: "",
    illnessDate: "",
  });

  const primaryCategory = form.categories[0] || "people";
  const primaryCategoryLabel = useMemo(
    () => REPORT_CATEGORIES.find((c) => c.id === primaryCategory)?.label || "People",
    [primaryCategory]
  );
  const symptomOptions = SYMPTOM_OPTIONS[primaryCategory] || SYMPTOM_OPTIONS.people;

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(form.feeling) && form.categories.length > 0;
    if (step === 2) return true;
    return true;
  }, [step, form]);

  const toggle = (key, value) => {
    setForm((f) => {
      const list = f[key];
      const present = list.includes(value);
      return {
        ...f,
        [key]: present ? list.filter((x) => x !== value) : [...list, value],
      };
    });
  };

  const next = () => {
    if (!canContinue) return;
    if (step === TOTAL_STEPS) {
      navigate("/report/sent");
      return;
    }
    setStep((s) => s + 1);
  };

  const back = () => {
    if (step === 1) {
      navigate("/");
      return;
    }
    setStep((s) => s - 1);
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="report-shell" style={{ position: "relative" }}>
      <PublicHeader minimal rightSlot={null} />
      <button
        type="button"
        className="report-close"
        aria-label="Close report"
        onClick={() => navigate("/")}
      >
        <X size={16} />
      </button>

      <main className="report-stage">
        <div className="report-step-row">
          <span className="report-step-label">Step {step} of {TOTAL_STEPS}</span>
          {step === 2 && (
            <span className="report-step-tag">
              {STEP2_TAG_BY_CATEGORY[primaryCategory] || "Details"}
            </span>
          )}
          {step === 3 && <span className="report-step-tag">Review</span>}
        </div>

        {step > 1 && (
          <div className="report-progress" aria-hidden="true">
            <div className="report-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {step === 1 && <Step1 form={form} setForm={setForm} toggle={toggle} />}
        {step === 2 && (
          <Step2
            form={form}
            setForm={setForm}
            toggle={toggle}
            symptoms={symptomOptions}
            primaryCategory={primaryCategory}
          />
        )}
        {step === 3 && (
          <Step3
            form={form}
            primaryCategoryLabel={primaryCategoryLabel}
            symptomOptions={symptomOptions}
          />
        )}

        <div className="report-footer">
          <span className="report-step-hint">
            {step === 2 ? "This is not a diagnosis. Share zip-code-level details only." : ""}
          </span>
          <div className="report-footer-actions">
            <button type="button" className="btn btn-ghost" onClick={back}>
              {step === 1 ? "Cancel" : "Back"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinue}
              onClick={next}
            >
              {step === TOTAL_STEPS ? "Send report" : step === 1 ? "Continue to report" : "Next"}
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {step === 1 && (
          <Link to="/" className="quiet-link" style={{ marginTop: 18 }}>
            ← Back home
          </Link>
        )}
      </main>
    </div>
  );
}

function Step1({ form, setForm, toggle }) {
  return (
    <>
      <h1 className="report-question">How are you feeling today?</h1>

      <div className="feeling-grid">
        {FEELING_OPTIONS.map((opt) => {
          const Icon = FEELING_ICONS[opt.icon] || Smile;
          const active = form.feeling === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              className={`feeling-card ${active ? "is-active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, feeling: opt.id }))}
            >
              <Icon size={28} strokeWidth={1.8} className="feeling-card-icon" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      <hr className="report-divider" />

      <h2 className="report-question" style={{ fontSize: 32, marginTop: 28 }}>
        What do you want to tell us about?
      </h2>
      <p className="report-help">You can pick more than one option.</p>

      <div className="choice-list choice-list--single">
        {REPORT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon] || User;
          const active = form.categories.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              className={`choice-row ${active ? "is-active" : ""}`}
              onClick={() => toggle("categories", cat.id)}
            >
              <span className="choice-row-icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="choice-row-body">
                <span className="choice-row-title">{cat.label}</span>
                <span className="choice-row-meta">{cat.description}</span>
              </span>
              <span className="choice-row-check">
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

const STEP2_COPY = {
  people:      { title: "Tell us about the illness",   subhead: "What are the symptoms?" },
  animals:     { title: "Tell us about the animal",    subhead: "What did you see?" },
  environment: { title: "Tell us what you noticed",    subhead: "What's going on?" },
  vector:      { title: "Tell us about the activity",  subhead: "What did you notice?" },
  hazard:      { title: "Tell us about the hazard",    subhead: "What's happening?" },
  unsure:      { title: "Tell us what you saw",        subhead: "Which fits best?" },
};

function Step2({ form, setForm, toggle, symptoms, primaryCategory }) {
  const [locating, setLocating] = useState(false);
  const copy = STEP2_COPY[primaryCategory] || STEP2_COPY.people;

  const detectZip = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          const res = await fetch(url, {
            headers: { "Accept-Language": "en" },
          });
          if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
          const data = await res.json();
          const zip = data?.address?.postcode;
          if (!zip) {
            toast.error("Couldn't find a ZIP for this spot — enter it manually.");
          } else {
            setForm((f) => ({ ...f, zip }));
            toast.success(`Using ZIP ${zip}`);
          }
        } catch (err) {
          toast.error("ZIP lookup failed. Enter it manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied.");
        } else {
          toast.error("Couldn't get your location.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <>
      <h1 className="report-question">{copy.title}</h1>
      <p className="report-help">Please answer a few simple questions.</p>

      <div className="report-subhead">{copy.subhead}</div>
      <div className="choice-list">
        {symptoms.map((sym) => {
          const Icon = SYMPTOM_ICONS[sym.icon] || Bug;
          const active = form.symptoms.includes(sym.id);
          return (
            <button
              key={sym.id}
              type="button"
              className={`choice-row ${active ? "is-active" : ""}`}
              onClick={() => toggle("symptoms", sym.id)}
            >
              <span className="choice-row-icon">
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="choice-row-body">
                <span className="choice-row-title">{sym.label}</span>
              </span>
              <span className="choice-row-check">
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <div className="report-subhead">Date of birth</div>
      <div className="report-field">
        <CalendarDays size={16} strokeWidth={2} />
        <input
          type="date"
          value={form.dob}
          onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
        />
      </div>

      <div className="report-subhead">When did the illness start?</div>
      <div className="report-field">
        <CalendarDays size={16} strokeWidth={2} />
        <input
          type="date"
          value={form.illnessDate}
          onChange={(e) => setForm((f) => ({ ...f, illnessDate: e.target.value }))}
        />
      </div>

      <div className="report-subhead">Where did this happen?</div>
      <div className="report-field">
        <MapPin size={16} strokeWidth={2} />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Zip code"
          value={form.zip}
          onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
        />
        <button
          type="button"
          className="report-field-action"
          onClick={detectZip}
          disabled={locating}
          aria-label="Use my current location"
        >
          {locating ? (
            <Loader2 size={14} className="report-spin" strokeWidth={2.2} />
          ) : (
            <LocateFixed size={14} strokeWidth={2.2} />
          )}
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      <label className="report-upload">
        <span className="report-upload-icon">
          <UploadCloud size={18} strokeWidth={1.8} />
        </span>
        <span className="report-upload-text">Optional photo placeholder</span>
        <input type="file" accept="image/*" style={{ display: "none" }} />
      </label>
    </>
  );
}

function Step3({ form, primaryCategoryLabel, symptomOptions }) {
  const symptomLabels = form.symptoms
    .map((id) => symptomOptions.find((s) => s.id === id)?.label)
    .filter(Boolean)
    .join(", ") || "—";

  return (
    <>
      <h1 className="report-question">Ready to send?</h1>
      <p className="report-help">
        We&apos;ll share this with local public-health partners. You can stay anonymous.
      </p>

      <div className="review-card">
        <div className="review-row">
          <span className="review-row-key">Feeling</span>
          <span className="review-row-value">
            {form.feeling === "sick" ? "Feeling sick" : "Feeling good"}
          </span>
        </div>
        <div className="review-row">
          <span className="review-row-key">Category</span>
          <span className="review-row-value">{primaryCategoryLabel}</span>
        </div>
        <div className="review-row">
          <span className="review-row-key">Symptoms</span>
          <span className="review-row-value">{symptomLabels}</span>
        </div>
        <div className="review-row">
          <span className="review-row-key">Date of birth</span>
          <span className="review-row-value">{form.dob || "—"}</span>
        </div>
        <div className="review-row">
          <span className="review-row-key">Illness started</span>
          <span className="review-row-value">{form.illnessDate || "—"}</span>
        </div>
        <div className="review-row">
          <span className="review-row-key">Zip code</span>
          <span className="review-row-value">{form.zip || "—"}</span>
        </div>
      </div>
    </>
  );
}
