/*
Marketing copy for the public-facing landing page. The web app itself
is an expert console; community reporting happens in the mobile app.
*/

export const LANDING_HERO = {
  eyebrow: "One Health · Arizona",
  title:
    "Spot health risks earlier, across people, animals, and the environment.",
  copy: "Community members report what they're seeing through the mobile app. Public-health partners triage, route, and respond from this console.",
  primaryCTA: { label: "Sign in to console", to: "/login" },
  secondaryCTA: { label: "About the project", to: "#about" },
  tertiaryCTA: { label: "How are you feeling?", to: "/report" },
};

export const LANDING_PILLARS = [
  {
    id: "mobile",
    title: "Mobile reporting",
    copy: "Anyone in Arizona can submit a one-minute report from the One Health mobile app — anonymous by default.",
  },
  {
    id: "console",
    title: "Expert console",
    copy: "Triage analysts, epidemiologists, and partner agencies coordinate response from a single shared workspace.",
  },
  {
    id: "alerts",
    title: "Public alerts",
    copy: "When clusters emerge, the team drafts and sends public alerts across SMS, email, and printable flyers.",
  },
];

export const LANDING_STEPS = [
  {
    id: "step-1",
    title: "Community reports in",
    copy: "Reports stream in from the mobile app with location, category, and signals attached.",
  },
  {
    id: "step-2",
    title: "Auto-routed by rule",
    copy: "Routing rules send each report to the right agency partner — animal, vector, environment, or human-health.",
  },
  {
    id: "step-3",
    title: "Coordinated response",
    copy: "Analysts annotate, draft alerts, and close the loop. Cluster detection surfaces patterns across the state.",
  },
];

export const LANDING_PARTNERS = [
  { id: "azdhs", label: "AZ Dept. of Health Services" },
  { id: "pima", label: "Pima County Health" },
  { id: "azgf", label: "AZ Game & Fish" },
  { id: "azda", label: "AZ Dept. of Agriculture" },
  { id: "adeq", label: "AZ Dept. of Environmental Quality" },
  { id: "uoa", label: "University of Arizona" },
];

export const FOOTER_LINKS = {
  product: [
    { label: "Sign in to console", to: "/login" },
    { label: "Register", to: "/register" },
    { label: "Mobile app (iOS)", to: "#mobile" },
    { label: "Mobile app (Android)", to: "#mobile" },
  ],
  resources: [
    { label: "Situation map", to: "#situation" },
    { label: "About", to: "#about" },
    { label: "How it works", to: "#how" },
    { label: "Partners", to: "#partners" },
    { label: "Privacy", to: "#privacy" },
  ],
  contact: [
    { label: "Press inquiries", to: "mailto:press@onehealth.az.gov" },
    { label: "Partner support", to: "mailto:partners@onehealth.az.gov" },
    { label: "Security disclosure", to: "mailto:security@onehealth.az.gov" },
  ],
};
