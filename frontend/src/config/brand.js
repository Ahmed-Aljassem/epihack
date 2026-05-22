/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Centralize app branding (name, lockup text, logo source)
so every page can render a consistent identity without duplicating strings.
*/

import appLogo from "../assets/logo.png";

export const BRAND = {
  appName: "detect",
  appNameWithRegion: "detect AZ",
  suiteName: "One Health",
  regionName: "Arizona",
  regionAbbr: "AZ",
  lockup: "One Health Arizona",
  lockupShort: "One Health AZ",
  tagline: "See · Report · Prevent",
  logoAlt: "Detect logo",
};

export const BRAND_LOGO_SRC = appLogo;
