import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Building2,
  Smartphone,
  LayoutDashboard,
  Megaphone,
  PawPrint,
  Leaf,
  CloudSun,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";
import {
  LANDING_HERO,
  LANDING_PILLARS,
  LANDING_STEPS,
  LANDING_PARTNERS,
  LANDING_COLLABORATION,
  FOOTER_LINKS,
} from "../data/publicContent";
import PublicSituationSection from "../components/public/PublicSituationSection";
import Reveal from "../components/public/Reveal";
import heroPhoneArt from "../assets/epihack.svg";
import { BRAND, BRAND_LOGO_SRC } from "../config/brand";

const PILLAR_ICONS = {
  mobile: Smartphone,
  console: LayoutDashboard,
  alerts: Megaphone,
};

const PARTNER_ICONS = {
  azdhs: Shield,
  pima: Building2,
  azgf: PawPrint,
  azda: Leaf,
  adeq: CloudSun,
  uoa: Building2,
};

const ENDING_PANDEMICS_URL =
  "https://endingpandemicsacademy.arizona.edu/";
const EPIHACK_ARIZONA_URL =
  "https://endingpandemicsacademy.arizona.edu/trainings-events/epihack-arizona";

export default function PublicHomePage() {
  const heroBandRef = useRef(null);

  useEffect(() => {
    const heroBand = heroBandRef.current;
    if (!heroBand) return undefined;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return undefined;

    // Target = where the halo should ultimately be (pointer position).
    // Current = where it actually is right now. Each frame we glide
    // `current` toward `target` so quick mouse jitter melts into smooth drift.
    const REST_X = 74;
    const REST_Y = 34;
    const REST_INTENSITY = 0.62;

    let targetX = REST_X;
    let targetY = REST_Y;
    let targetIntensity = REST_INTENSITY;
    let currentX = REST_X;
    let currentY = REST_Y;
    let currentIntensity = REST_INTENSITY;

    let rafId = 0;
    const EASING = 0.12;   // 0–1 — lower is smoother / laggier
    const EPSILON = 0.05;  // stop the loop once we're this close to target

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const tick = () => {
      currentX += (targetX - currentX) * EASING;
      currentY += (targetY - currentY) * EASING;
      currentIntensity += (targetIntensity - currentIntensity) * EASING;

      heroBand.style.setProperty("--hero-halo-x", `${currentX.toFixed(2)}%`);
      heroBand.style.setProperty("--hero-halo-y", `${currentY.toFixed(2)}%`);
      heroBand.style.setProperty(
        "--hero-halo-intensity",
        currentIntensity.toFixed(3)
      );

      const settled =
        Math.abs(targetX - currentX) < EPSILON &&
        Math.abs(targetY - currentY) < EPSILON &&
        Math.abs(targetIntensity - currentIntensity) < EPSILON;

      if (settled) {
        rafId = 0;
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (event) => {
      if (event.pointerType === "touch") return;
      const rect = heroBand.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      const pointerY = ((event.clientY - rect.top) / rect.height) * 100;
      targetX = clamp(pointerX, 0, 100);
      targetY = clamp(pointerY, 0, 100);
      targetIntensity = 0.94;
      ensureLoop();
    };

    const onPointerEnter = (event) => {
      if (event.pointerType === "touch") return;
      targetIntensity = 0.88;
      ensureLoop();
    };

    const onPointerLeave = () => {
      targetX = REST_X;
      targetY = REST_Y;
      targetIntensity = REST_INTENSITY;
      ensureLoop();
    };

    heroBand.addEventListener("pointermove", onPointerMove);
    heroBand.addEventListener("pointerenter", onPointerEnter);
    heroBand.addEventListener("pointerleave", onPointerLeave);

    return () => {
      heroBand.removeEventListener("pointermove", onPointerMove);
      heroBand.removeEventListener("pointerenter", onPointerEnter);
      heroBand.removeEventListener("pointerleave", onPointerLeave);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <section ref={heroBandRef} className="landing-hero landing-hero-band">
          <div className="landing-hero-inner">
            <div className="landing-hero-content">
              <div className="landing-hero-eyebrow hero-anim" style={{ "--anim-delay": "0ms" }}>
                {LANDING_HERO.eyebrow}
              </div>
              <h1 className="landing-hero-title hero-anim" style={{ "--anim-delay": "80ms" }}>
                {LANDING_HERO.title}
              </h1>
              <p className="landing-hero-copy hero-anim" style={{ "--anim-delay": "160ms" }}>
                {LANDING_HERO.copy}
              </p>
              <div className="landing-hero-actions hero-anim" style={{ "--anim-delay": "220ms" }}>
                <Link
                  to={LANDING_HERO.tertiaryCTA.to}
                  className="btn btn-cta-large"
                >
                  <span className="cta-badge">Start now</span>
                  <span className="cta-label">{LANDING_HERO.tertiaryCTA.label}</span>
                  <span className="cta-arrow">
                    <ArrowRight size={18} strokeWidth={2.2} />
                  </span>
                </Link>
              </div>
            </div>
            <div className="landing-hero-visual hero-anim-fade" style={{ "--anim-delay": "120ms" }} aria-hidden="true">
              <img
                src={heroPhoneArt}
                alt=""
                className="landing-hero-phone"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
          <button
            type="button"
            className="landing-hero-scroll"
            onClick={() => {
              const target = document.getElementById("situation");
              if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            aria-label="Scroll to live statewide view"
          >
            <span className="landing-hero-scroll-icon" aria-hidden="true">
              <ChevronDown size={16} strokeWidth={2.4} />
            </span>
          </button>
        </section>

        <PublicSituationSection />

        <Reveal as="section" id="pillars" className="landing-pillars">
          {LANDING_PILLARS.map((pillar, i) => {
            const Icon = PILLAR_ICONS[pillar.id] || Shield;
            return (
              <article
                key={pillar.id}
                className="landing-pillar reveal-stagger"
                style={{ "--stagger": i }}
              >
                <div className="landing-pillar-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="landing-pillar-title">{pillar.title}</h3>
                <p className="landing-pillar-copy">{pillar.copy}</p>
              </article>
            );
          })}
        </Reveal>

        <Reveal as="section" id="how" className="landing-steps">
          <div className="landing-section-eyebrow">How it works</div>
          <h2 className="landing-section-title">
            From a single report to coordinated response.
          </h2>
          <ol className="landing-step-list">
            {LANDING_STEPS.map((step, i) => (
              <li
                key={step.id}
                className="landing-step reveal-stagger"
                style={{ "--stagger": i }}
              >
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
        </Reveal>

        <Reveal as="section" id="partners" className="landing-partners">
          <div className="landing-section-eyebrow">Partners</div>
          <h2 className="landing-section-title">
            Built with Arizona's public-health partners.
          </h2>
          <div className="landing-partner-grid">
            {LANDING_PARTNERS.map((p, i) => {
              const Icon = PARTNER_ICONS[p.id] || Building2;
              return (
                <div
                  key={p.id}
                  className="landing-partner-card reveal-stagger"
                  style={{ "--stagger": i }}
                >
                  <span className="landing-partner-card-icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="landing-partner-card-label">{p.label}</span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" id="about" className="landing-collab">
          <div className="landing-section-eyebrow">
            {LANDING_COLLABORATION.eyebrow}
          </div>
          <h2 className="landing-section-title">{LANDING_COLLABORATION.title}</h2>
          <div className="landing-collab-card">
            <p className="landing-collab-copy">
              This project was shaped by a diverse group working together during{" "}
              <a href={EPIHACK_ARIZONA_URL} target="_blank" rel="noreferrer">
                EpiHack Arizona
              </a>
              . It brings together technologists, public health professionals,
              tribal and community experts, local government partners, university
              collaborators, and students from the University of Arizona. The work
              is supported through the{" "}
              <a href={ENDING_PANDEMICS_URL} target="_blank" rel="noreferrer">
                Ending Pandemics Academy at the University of Arizona
              </a>
              , where each group contributes lived experience, field knowledge,
              technical expertise, and practical ideas for how community reporting
              should work in real settings.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="landing-cta">
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
        </Reveal>
      </main>

      <footer id="privacy" className="public-footer">
        <div className="public-footer-grid">
          <div className="public-footer-brand">
            <Link to="/" className="public-brand">
              <span className="public-brand-mark">
                <img
                  src={BRAND_LOGO_SRC}
                  alt={BRAND.logoAlt}
                  className="public-brand-logo"
                />
              </span>
              <span className="public-brand-lockup">
                <strong>{BRAND.appName}</strong>
                <span className="public-brand-region">{BRAND.regionAbbr}</span>
              </span>
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
            © 2026 {BRAND.appNameWithRegion} / {BRAND.lockup}
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
