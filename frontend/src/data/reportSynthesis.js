/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Generate deterministic demo surveillance parameters so the
dashboard can surface more realistic insights without needing live PHI data.
*/

const HUMAN_SYMPTOM_SETS = [
  ["Fever", "Body aches", "Fatigue"],
  ["Nausea", "Diarrhea", "Stomach cramps"],
  ["Cough", "Sore throat", "Headache"],
  ["Rash", "Red eyes", "Fever"],
  ["Difficulty breathing", "Chills", "Fatigue"],
];

const HUMAN_DIAGNOSES = [
  "Influenza-like illness",
  "Acute gastroenteritis",
  "Undifferentiated febrile illness",
  "Heat-related illness",
  "Respiratory viral syndrome",
];

const LIVESTOCK_SPECIES = ["Cattle", "Goat", "Sheep", "Horse", "Poultry"];
const WILDLIFE_SPECIES = ["Coyote", "Bat", "Javelina", "Raccoon", "Deer"];
const LIVESTOCK_SIGN_SETS = [
  ["Lethargy", "Loss of appetite", "Fever"],
  ["Respiratory distress", "Nasal discharge", "Weakness"],
  ["Diarrhea", "Dehydration", "Fatigue"],
  ["Neurologic signs", "Unsteady gait", "Drooling"],
  ["Sudden drop in production", "Fatigue", "Fever"],
];
const WILDLIFE_SIGN_SETS = [
  ["Found dead", "Trauma absent", "Scavenger activity"],
  ["Unsteady gait", "Disorientation", "Lethargy"],
  ["Aggressive behavior", "Salivation", "Neurologic signs"],
  ["Multiple carcasses", "Water-edge exposure", "Weakness"],
  ["Respiratory distress", "Staggering", "Found near housing"],
];
const ENVIRONMENTAL_SIGNALS = [
  "Water contamination concern",
  "Odor and runoff complaint",
  "Fish die-off report",
  "Standing water hazard",
  "Waste exposure concern",
];
const ENVIRONMENTAL_SIGNAL_TAGS = {
  "Water contamination concern": ["Water contamination", "Shared water exposure"],
  "Odor and runoff complaint": ["Runoff complaint", "Odor irritation"],
  "Fish die-off report": ["Fish die-off", "Surface water stress"],
  "Standing water hazard": ["Standing water", "Mosquito breeding risk"],
  "Waste exposure concern": ["Waste exposure", "Surface contamination"],
};
const VECTOR_TYPES = ["Mosquito", "Tick", "Flea", "Rodent"];
const VECTOR_PATHWAYS = Object.freeze({
  Mosquito: {
    topLevelSlug: "env",
    topLevelLabel: "Environment",
    pathwayLabel: "Environmental vector conditions",
  },
  Tick: {
    topLevelSlug: "people",
    topLevelLabel: "People",
    pathwayLabel: "Human bite and exposure follow-up",
  },
  Flea: {
    topLevelSlug: "animal",
    topLevelLabel: "Animal",
    pathwayLabel: "Animal host surveillance",
  },
  Rodent: {
    topLevelSlug: "env",
    topLevelLabel: "Environment",
    pathwayLabel: "Environmental vector conditions",
  },
});
const EXPOSURE_TYPES = [
  "recentTravel",
  "massGathering",
  "animalContact",
  "sickPersonContact",
  "insectBite",
];

const CATEGORY_DAY_PATTERNS = {
  people: [6, 6, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  animal: [6, 6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0],
  env: [6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 1, 1, 1, 6, 5, 4, 3, 2, 1, 0, 0, 0],
  vector: [6, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
};

const CATEGORY_MINUTES = {
  people: [180, 220, 260, 340, 420, 510],
  animal: [260, 330, 420, 520, 650, 780],
  env: [210, 390, 560, 730, 840],
  vector: [90, 120, 160, 210, 270, 330],
};

const STATUSES = ["New", "In review", "Routed", "Resolved"];

export function synthesizeReportProfile({
  raw,
  categorySlug,
  categoryLabel,
  location,
  anchorMs,
  sourceType = raw.type,
  vectorPathway = null,
}) {
  const seed = buildReportSeed(raw, location);
  const ordinal = Math.floor((raw.id - 1) / 4);
  const submittedAtDate = buildSubmittedAt({
    anchorMs,
    timingKey: sourceType === "vector" ? "vector" : categorySlug,
    ordinal,
    seed,
    county: location.county,
  });
  const analytics = buildAnalytics({
    seed,
    categorySlug,
    categoryLabel,
    location,
    sourceType,
    vectorPathway,
  });
  const status = STATUSES[(raw.id + analytics.priorityScore) % STATUSES.length];

  return {
    status,
    summary: analytics.summary,
    submittedAtDate,
    analytics,
  };
}

export function resolveVectorPathway(raw, location) {
  const seed = buildReportSeed(raw, location);
  const vectorType = VECTOR_TYPES[vectorOrdinal(raw.id) % VECTOR_TYPES.length];
  const pathway = VECTOR_PATHWAYS[vectorType] || VECTOR_PATHWAYS.Mosquito;

  return {
    seed,
    vectorType,
    ...pathway,
  };
}

function buildAnalytics({
  seed,
  categorySlug,
  categoryLabel,
  location,
  sourceType,
  vectorPathway,
}) {
  const commonExposures = EXPOSURE_TYPES.reduce((acc, key, index) => {
    acc[key] = ((seed + index * 7) % 5) === 0;
    return acc;
  }, {});

  if (sourceType === "vector") {
    const vectorType = vectorPathway?.vectorType || VECTOR_TYPES[seed % VECTOR_TYPES.length];
    const numVectors = 8 + (seed % 36);
    const biteReports = seed % 4 === 0 ? 1 + ((seed + 3) % 4) : 0;
    const unusualIncrease = seed % 3 !== 1;
    const impactScore = Math.round(
      numVectors / 3 +
      biteReports * 2 +
      (unusualIncrease ? 5 : 0) +
      (commonExposures.insectBite ? 2 : 0),
    );

    return {
      categoryLabel,
      reportClass: "vector",
      pathCategorySlug: categorySlug,
      pathCategoryLabel: categoryLabel,
      pathwayLabel: vectorPathway?.pathwayLabel || "Vector-linked surveillance",
      summary: buildVectorSummary({
        categorySlug,
        vectorType,
        biteReports,
        numVectors,
        location,
      }),
      vectorType,
      numVectors,
      biteReports,
      unusualIncrease,
      signalTags: buildVectorSignalTags({ vectorType, biteReports, unusualIncrease }),
      exposures: commonExposures,
      priorityScore: unusualIncrease ? 3 : 1,
      impactScore,
    };
  }

  if (categorySlug === "people") {
    const symptoms = HUMAN_SYMPTOM_SETS[seed % HUMAN_SYMPTOM_SETS.length];
    const diagnosis = HUMAN_DIAGNOSES[(seed + 2) % HUMAN_DIAGNOSES.length];
    const numAffected = 2 + (seed % 6);
    const visitedDoctor = seed % 3 !== 0;
    const receivedDiagnosis = seed % 4 !== 0;
    const absentSchool = seed % 5 === 0 ? 1 + (seed % 2) : 0;
    const absentWork = seed % 3 === 0 ? 1 + ((seed + 1) % 3) : 0;
    const severeSignals = [
      seed % 6 === 0 ? "Bloody diarrhea" : null,
      seed % 7 === 0 ? "Yellow eyes" : null,
      seed % 8 === 0 ? "Difficulty breathing" : null,
    ].filter(Boolean);
    const impactScore = Math.round(
      numAffected * 1.8 +
      symptoms.length * 1.2 +
      severeSignals.length * 3 +
      (visitedDoctor ? 2 : 0) +
      (receivedDiagnosis ? 1 : 0) +
      absentSchool +
      absentWork,
    );

    return {
      categoryLabel,
      reportClass: "human",
      summary: `${symptoms[0]} cluster affecting ${numAffected} people`,
      symptoms,
      diagnosis,
      numAffected,
      visitedDoctor,
      receivedDiagnosis,
      absentSchool,
      absentWork,
      severeSignals,
      signalTags: uniqueTags([...symptoms, ...severeSignals]),
      exposures: commonExposures,
      priorityScore: severeSignals.length + (visitedDoctor ? 1 : 0),
      impactScore,
    };
  }

  if (categorySlug === "animal") {
    const reportClass = seed % 10 < 6 ? "livestock" : "wildlife";
    const speciesPool = reportClass === "livestock" ? LIVESTOCK_SPECIES : WILDLIFE_SPECIES;
    const signPool = reportClass === "livestock" ? LIVESTOCK_SIGN_SETS : WILDLIFE_SIGN_SETS;
    const species = speciesPool[seed % speciesPool.length];
    const clinicalSigns = signPool[seed % signPool.length];
    const numAnimalsSick = 1 + (seed % 7);
    const numAnimalsDead = seed % 4 === 0 ? 1 + ((seed + 1) % 3) : 0;
    const suspectedCause = numAnimalsDead > 0 ? "unexpected deaths" : "illness observations";
    const impactScore = Math.round(
      numAnimalsSick * 2 +
      numAnimalsDead * 4 +
      (reportClass === "wildlife" ? 3 : 1) +
      (commonExposures.animalContact ? 2 : 0),
    );

    return {
      categoryLabel,
      reportClass,
      summary: `${species} ${suspectedCause} reported near ${location.city || location.county}`,
      species,
      clinicalSigns,
      numAnimalsSick,
      numAnimalsDead,
      suspectedCause,
      signalTags: uniqueTags([
        ...clinicalSigns,
        reportClass === "livestock" ? "Livestock illness" : "Wildlife event",
        numAnimalsDead > 0 ? "Animal deaths" : null,
      ]),
      exposures: commonExposures,
      priorityScore: numAnimalsDead > 0 ? 3 : 1,
      impactScore,
    };
  }

  if (categorySlug === "env") {
    const signalType = ENVIRONMENTAL_SIGNALS[seed % ENVIRONMENTAL_SIGNALS.length];
    const affectedSites = 1 + (seed % 4);
    const severityLevel = ["Moderate", "Elevated", "High"][seed % 3];
    const impactScore = Math.round(
      affectedSites * 3 +
      (severityLevel === "High" ? 5 : severityLevel === "Elevated" ? 3 : 1) +
      (commonExposures.massGathering ? 2 : 0),
    );

    return {
      categoryLabel,
      reportClass: "environment",
      summary: `${signalType} across ${affectedSites} nearby site${affectedSites === 1 ? "" : "s"}`,
      signalType,
      affectedSites,
      severityLevel,
      signalTags: uniqueTags([
        ...(ENVIRONMENTAL_SIGNAL_TAGS[signalType] || [signalType]),
        severityLevel === "High" ? "High-priority hazard" : null,
      ]),
      exposures: commonExposures,
      priorityScore: severityLevel === "High" ? 3 : 1,
      impactScore,
    };
  }

  return {
    categoryLabel,
    reportClass: "environment",
    summary: `${ENVIRONMENTAL_SIGNALS[seed % ENVIRONMENTAL_SIGNALS.length]} across nearby sites`,
    signalTags: ["Field signal"],
    exposures: commonExposures,
    priorityScore: 1,
    impactScore: 1,
  };
}

function buildSubmittedAt({ anchorMs, timingKey, ordinal, seed, county }) {
  const pattern = CATEGORY_DAY_PATTERNS[timingKey] || CATEGORY_DAY_PATTERNS.people;
  const minuteSet = CATEGORY_MINUTES[timingKey] || CATEGORY_MINUTES.people;
  let dayOffset = pattern[ordinal % pattern.length];

  if (timingKey === "vector" && isHotCounty(county)) {
    dayOffset = Math.max(0, dayOffset - 1);
  }

  const minuteOffset =
    minuteSet[seed % minuteSet.length] +
    ((seed * 19) % 47);

  return new Date(anchorMs - ((dayOffset * 24 * 60) + minuteOffset) * 60_000);
}

function isHotCounty(county = "") {
  return ["Maricopa Co.", "Pima Co.", "Pinal Co.", "Yuma Co."].includes(county);
}

export function buildReportSeed(raw, location) {
  const zipTail = Number((location.zip || "85001").slice(-2));
  return raw.id * 37 + zipTail;
}

function vectorOrdinal(rawId) {
  return Math.max(0, Math.floor((rawId - 2) / 4));
}

function buildVectorSummary({
  categorySlug,
  vectorType,
  biteReports,
  numVectors,
  location,
}) {
  const place = location.city || location.county || "the area";

  if (categorySlug === "people") {
    return biteReports > 0
      ? `${vectorType} bite and exposure reports increasing near ${place}`
      : `${vectorType} human exposure signal rising near ${place}`;
  }

  if (categorySlug === "animal") {
    return `${vectorType} activity around animal hosts near ${place}`;
  }

  return `${vectorType} habitat and density spike with ${numVectors} vectors near ${place}`;
}

function buildVectorSignalTags({ vectorType, biteReports, unusualIncrease }) {
  return uniqueTags([
    `${vectorType} activity`,
    `${vectorType} density`,
    unusualIncrease ? "Unusual vector increase" : null,
    biteReports > 0 ? "Bite reports" : null,
  ]);
}

function uniqueTags(values = []) {
  return [...new Set(values.filter(Boolean))];
}
