import { Link } from "react-router-dom";
import { Shield, Thermometer, Bug, PawPrint, ChevronRight } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

const NEARBY_SIGNALS = [
  {
    id: "heat",
    title: "Heat advisory",
    meta: "Thru Fri",
    icon: Thermometer,
    tone: "warn",
  },
  {
    id: "mosquito",
    title: "More mosquitoes than usual",
    meta: "NW Pima",
    icon: Bug,
    tone: "env",
  },
  {
    id: "animal",
    title: "3 animal reports nearby",
    meta: "7d",
    icon: PawPrint,
    tone: "accent",
  },
];

export default function PublicHomePage() {
  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <div className="public-eyebrow">Tuesday · 19 May · Tucson, AZ</div>
        <h1 className="public-title">Today.</h1>
        <p className="public-lede">
          Help Arizona spot human, animal, and environmental health risks earlier.
          Anonymous. About a minute.
        </p>

        <section className="public-hero-card">
          <div>
            <div className="public-hero-eyebrow">Tucson · 85719</div>
            <h2 className="public-hero-title">See something worth reporting?</h2>
            <p className="public-hero-copy">
              People, animals, and the environment share health signals.
              A one-minute report helps Arizona&apos;s public-health partners respond earlier.
            </p>
            <div className="public-hero-actions">
              <Link className="btn btn-primary" to="/report">Report a concern</Link>
              <a className="btn btn-ghost" href="#about">Learn more</a>
            </div>
          </div>
          <div className="public-hero-icon" aria-hidden="true">
            <Shield size={48} strokeWidth={1.6} />
          </div>
        </section>

        <div className="public-section-eyebrow" id="nearby">Nearby today</div>
        <div className="public-signal-list">
          {NEARBY_SIGNALS.map(({ id, title, meta, icon: Icon, tone }) => (
            <div key={id} className="public-signal-row" role="button" tabIndex={0}>
              <div className={`public-signal-icon public-signal-icon--${tone}`}>
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="public-signal-title">{title}</div>
              <div className="public-signal-meta">{meta}</div>
              <ChevronRight size={16} className="public-signal-chev" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
