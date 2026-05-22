import { Link } from "react-router-dom";
import {
  Shield,
  Smartphone,
  LayoutDashboard,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";
import {
  LANDING_HERO,
  LANDING_PILLARS,
  LANDING_STEPS,
  LANDING_PARTNERS,
  FOOTER_LINKS,
} from "../data/publicContent";

const PILLAR_ICONS = {
  mobile: Smartphone,
  console: LayoutDashboard,
  alerts: Megaphone,
};

export default function PublicHomePage() {
  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <section className="landing-hero">
          <div className="landing-hero-eyebrow">{LANDING_HERO.eyebrow}</div>
          <h1 className="landing-hero-title">{LANDING_HERO.title}</h1>
          <p className="landing-hero-copy">{LANDING_HERO.copy}</p>
          <div className="landing-hero-actions">
            <Link
              to={LANDING_HERO.tertiaryCTA.to}
              className="btn btn-cta-large"
            >
              <span className="cta-badge">Start now</span>
              {LANDING_HERO.tertiaryCTA.label}
              <ArrowRight size={18} strokeWidth={2.2} />
            </Link>
          </div>
        </section>

        <section id="about" className="landing-pillars">
          {LANDING_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.id] || Shield;
            return (
              <article key={pillar.id} className="landing-pillar">
                <div className="landing-pillar-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="landing-pillar-title">{pillar.title}</h3>
                <p className="landing-pillar-copy">{pillar.copy}</p>
              </article>
            );
          })}
        </section>

        <section id="how" className="landing-steps">
          <div className="landing-section-eyebrow">How it works</div>
          <h2 className="landing-section-title">
            From a single report to coordinated response.
          </h2>
          <ol className="landing-step-list">
            {LANDING_STEPS.map((step, i) => (
              <li key={step.id} className="landing-step">
                <span className="landing-step-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="landing-step-title">{step.title}</h4>
                  <p className="landing-step-copy">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="partners" className="landing-partners">
          <div className="landing-section-eyebrow">Partners</div>
          <h2 className="landing-section-title">
            Built with Arizona's public-health partners.
          </h2>
          <div className="landing-partner-grid">
            {LANDING_PARTNERS.map((p) => (
              <div key={p.id} className="landing-partner-card">
                {p.label}
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <h2 className="landing-cta-title">
              Ready to triage today's signals?
            </h2>
            <p className="landing-cta-copy">
              The console is open to verified public-health partners across
              Arizona.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary">
            Sign in to console
            <ArrowRight size={16} strokeWidth={2.2} />
          </Link>
        </section>
      </main>

      <footer id="privacy" className="public-footer">
        <div className="public-footer-grid">
          <div className="public-footer-brand">
            <Link to="/" className="public-brand">
              <span className="public-brand-mark">
                <Shield size={16} strokeWidth={2.2} />
              </span>
              <span>One Health</span>
            </Link>
            <p className="public-footer-tagline">
              Arizona's One Health surveillance project — community signals
              routed to public-health response.
            </p>
          </div>

          <FooterColumn title="Product" links={FOOTER_LINKS.product} />
          <FooterColumn title="Resources" links={FOOTER_LINKS.resources} />
          <FooterColumn title="Contact" links={FOOTER_LINKS.contact} />
        </div>
        <div className="public-footer-base">
          <span>
            © 2026 One Health Arizona · A University of Arizona project
          </span>
          <span>v0.1 · For demonstration purposes</span>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <div className="public-footer-heading">{title}</div>
      <ul className="public-footer-list">
        {links.map((l) => (
          <li key={l.label}>
            {l.to?.startsWith("mailto:") || l.to?.startsWith("#") ? (
              <a href={l.to}>{l.label}</a>
            ) : (
              <Link to={l.to}>{l.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
