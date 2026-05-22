import type { SavedReport } from './storage';

export type ResourceAction =
  | { label: string; type: 'route'; target: string; primary?: boolean; detail?: string }
  | { label: string; type: 'link'; target: string; primary?: boolean; detail?: string }
  | { label: string; type: 'call'; target: string; primary?: boolean; detail?: string };

export interface SymptomResourceRecommendation {
  title: string;
  summary: string;
  reason: string;
  tone: 'default' | 'warning' | 'danger';
  icon: 'map-outline' | 'analytics-outline' | 'medkit-outline' | 'alert-circle-outline' | 'bug-outline' | 'paw-outline';
  matchedSymptoms: string[];
  actions: ResourceAction[];
  nationResources?: ResourceAction[];
}

const PIMA_RESPIRATORY_DATA =
  'https://www.pima.gov/3153/Respiratory-ILLNESS-Data';
const ARIZONA_RESPIRATORY_DASHBOARD =
  'https://www.azdhs.gov/preparedness/epidemiology-disease-control/infectious-disease-epidemiology/respiratory-illness/dashboards/index.php#respiratory-summary';
const RMSF_GUIDE =
  'https://www.cdc.gov/rocky-mountain-spotted-fever/about/index.html';
const WEST_NILE_GUIDE =
  'https://www.cdc.gov/west-nile-virus/about/index.html';
const VECTOR_SURV_MAP =
  'https://maps.vectorsurv.org/arbo';
const RABIES_INFO =
  'https://www.pima.gov/2868/Rabies';
const AZ_GAME_AND_FISH_DISPATCH =
  'tel:6232367201';
const PIMA_ANIMAL_CARE_CENTER =
  'tel:5207245900';
const PIMA_HEALTH_RABIES =
  'tel:5207247797';
const USDA_SICK_BIRD_HOTLINE =
  'tel:8665367593';
const PLACEHOLDER_TO_NATION_PHONE =
  'tel:5555555555';
const PLACEHOLDER_TO_NATION_DETAIL =
  '(555) 555-5555';
const TOHONO_NATION_ZIPCODES = new Set([
  '85123',
  '85132',
  '85193',
  '85321',
  '85322',
  '85337',
  '85634',
  '85746',
  '85756',
]);

const SEVERE_RULES = [
  { label: 'Difficulty breathing', terms: ['difficulty breathing', 'trouble breathing', 'shortness of breath'] },
  { label: 'Yellow skin or eyes', terms: ['yellow skin', 'yellow eyes', 'jaundice'] },
  { label: 'Bloody urine', terms: ['bloody urine', 'blood in urine'] },
];

const VECTOR_RULES = [
  { label: 'Tick bite', terms: ['tick bite'] },
  { label: 'Insect bite', terms: ['insect bite', 'bug bite', 'mosquito bite'] },
];

const VECTOR_PRESENCE_RULES = [
  { label: 'Unusual mosquito activity', terms: ['unusual mosquito activity', 'mosquito activity', 'mosquito surge', 'vector presence', 'vector spotting'] },
];

const ILI_RULES = [
  { label: 'Fever', terms: ['fever'] },
  { label: 'Rash', terms: ['rash'] },
  { label: 'Chills', terms: ['chills'] },
  { label: 'Body aches', terms: ['body aches', 'body ache', 'muscle ache', 'muscle aches'] },
];

const RESPIRATORY_RULES = [
  { label: 'Cough', terms: ['cough'] },
  { label: 'Congestion', terms: ['congestion', 'congested'] },
  { label: 'Sore throat', terms: ['sore throat'] },
];

const MILD_RULES = [
  { label: 'Nausea', terms: ['nausea'] },
  { label: 'Vomiting', terms: ['vomiting', 'vomit'] },
  { label: 'Diarrhea', terms: ['diarrhea'] },
  { label: 'Loss of smell or taste', terms: ['loss of smell', 'loss of taste'] },
  { label: 'Red eyes', terms: ['red eyes', 'red eye', 'pink eye', 'conjunctivitis'] },
];

const ANIMAL_ILLNESS_RULES = [
  { label: 'Sick animals', terms: ['sick animals', 'animal illness', 'livestock incident'] },
  { label: 'Dead birds nearby', terms: ['dead birds nearby', 'dead bird', 'dead birds', 'sick bird', 'dead poultry', 'sick poultry'] },
];

const ANIMAL_BITE_RULES = [
  { label: 'Animal bite', terms: ['animal bite', 'bitten by animal', 'bit by animal'] },
  { label: 'Dog bite', terms: ['dog bite', 'bitten by dog', 'bit by dog', 'dog bit'] },
  { label: 'Cat bite', terms: ['cat bite', 'bitten by cat', 'bit by cat', 'cat bit'] },
  { label: 'Bat bite', terms: ['bat bite', 'bitten by bat', 'bit by bat', 'bat bit'] },
  { label: 'Wildlife bite', terms: ['wildlife bite', 'bitten by wildlife', 'bit by wildlife'] },
];

function phoneResource(label: string, target: string, detail: string): ResourceAction {
  return { label, type: 'call', target, detail };
}

function placeholderNationResource(label: string): ResourceAction {
  return {
    label,
    type: 'call',
    target: PLACEHOLDER_TO_NATION_PHONE,
    detail: PLACEHOLDER_TO_NATION_DETAIL,
  };
}

const TO_NATION_RESPIRATORY_RESOURCES: ResourceAction[] = [
  phoneResource('DHHS CHS', 'tel:5203836200', '(520) 383-6200'),
  placeholderNationResource('TOHC Public Health Nursing'),
];

const TO_NATION_VECTOR_ENCOUNTER_RESOURCES: ResourceAction[] = [
  ...TO_NATION_RESPIRATORY_RESOURCES,
  phoneResource('Environmental Health (Phoenix Indian Medical Center)', 'tel:6022631200', '(602) 263-1200'),
  placeholderNationResource('Natural Resources: Range Conservation'),
  placeholderNationResource('Natural Resources: Veterinary Clinic'),
  placeholderNationResource('Natural Resources: Livestock inspectors'),
];

const TO_NATION_ANIMAL_BITE_RESOURCES: ResourceAction[] = [
  phoneResource('TOHC Environmental Health (Phoenix Indian Medical Center)', 'tel:6022631200', '(602) 263-1200'),
  placeholderNationResource('Natural Resources: Animal Control'),
  placeholderNationResource('Natural Resources: Livestock inspectors'),
  placeholderNationResource('Natural Resources: Range Conservation'),
];

const TO_NATION_ANIMAL_ILLNESS_RESOURCES: ResourceAction[] = [
  phoneResource('TOHC Environmental Health (Phoenix Indian Medical Center)', 'tel:6022631200', '(602) 263-1200'),
  placeholderNationResource('Natural Resources: Animal Control'),
  placeholderNationResource('Natural Resources: Veterinary Clinic'),
  placeholderNationResource('Natural Resources: Livestock inspectors'),
  placeholderNationResource('Natural Resources: Range Conservation'),
];

const TO_NATION_VECTOR_PRESENCE_RESOURCES: ResourceAction[] = [
  placeholderNationResource('TONDHHS CHS & Epidemiology'),
  placeholderNationResource('Environmental Health'),
];

export function isTohonoNationZip(zip: string | null | undefined): boolean {
  return typeof zip === 'string' && TOHONO_NATION_ZIPCODES.has(zip.trim());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsTerm(text: string, term: string): boolean {
  return new RegExp(`(^|\\b)${escapeRegExp(term)}(\\b|$)`, 'i').test(text);
}

function collectMatches(text: string, symptoms: string[], rules: { label: string; terms: string[] }[]): string[] {
  const symptomText = symptoms.join(' ').toLowerCase();

  return rules
    .filter(({ terms }) => terms.some((term) => containsTerm(text, term) || containsTerm(symptomText, term)))
    .map(({ label }) => label);
}

function getReportText(report: SavedReport): string {
  return [
    ...(report.symptoms ?? []),
    ...(report.observations ?? []),
    report.otherSymptomText ?? '',
    report.notes ?? '',
    report.diagnosis ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

export function getSymptomResourceRecommendation(
  report: SavedReport | null,
): SymptomResourceRecommendation | null {
  if (!report) return null;

  const symptoms = report.symptoms ?? [];
  const text = getReportText(report);
  const severeMatches = collectMatches(text, symptoms, SEVERE_RULES);
  const animalBiteMatches = collectMatches(text, symptoms, ANIMAL_BITE_RULES);
  const vectorMatches = collectMatches(text, symptoms, VECTOR_RULES);
  const vectorPresenceMatches = collectMatches(text, report.observations ?? [], VECTOR_PRESENCE_RULES);
  const iliMatches = collectMatches(text, symptoms, ILI_RULES);
  const respiratoryMatches = collectMatches(text, symptoms, RESPIRATORY_RULES);
  const mildMatches = collectMatches(text, symptoms, MILD_RULES);
  const animalIllnessMatches = report.category.includes('animals')
    ? collectMatches(text, report.observations ?? [], ANIMAL_ILLNESS_RULES)
    : [];

  if (severeMatches.length > 0) {
    return {
      title: 'Emergency care recommended',
      summary: 'Some symptoms in your report can be signs of a medical emergency. Get emergency help right away if you are having trouble breathing or other urgent warning signs.',
      reason: `Matched ${severeMatches.join(', ')} from your latest report.`,
      tone: 'danger',
      icon: 'alert-circle-outline',
      matchedSymptoms: severeMatches,
      actions: [{ label: 'Call 911', type: 'call', target: 'tel:911', primary: true }],
    };
  }

  if (animalBiteMatches.length > 0) {
    const wildlifeRelated = animalBiteMatches.includes('Bat bite') || animalBiteMatches.includes('Wildlife bite');

    return {
      title: 'Rabies-related resources',
      summary: 'Animal bites can need quick follow-up. These contacts can help with rabies guidance, animal control, and next steps.',
      reason: `Matched ${animalBiteMatches.join(', ')} from your latest report.`,
      tone: 'warning',
      icon: 'paw-outline',
      matchedSymptoms: animalBiteMatches,
      actions: [
        { label: 'Pima rabies info', type: 'link', target: RABIES_INFO, primary: true },
        { label: 'Pima County rabies assessment', type: 'call', target: PIMA_HEALTH_RABIES },
        { label: 'Pima Animal Care Center', type: 'call', target: PIMA_ANIMAL_CARE_CENTER },
        ...(wildlifeRelated ? [{ label: 'AZ Game and Fish dispatch', type: 'call' as const, target: AZ_GAME_AND_FISH_DISPATCH }] : []),
      ],
      nationResources: TO_NATION_ANIMAL_BITE_RESOURCES,
    };
  }

  if (vectorMatches.length > 0) {
    return {
      title: 'Tick or insect bite guidance',
      summary: 'A tick or insect bite can need follow-up care. This guide explains what to watch for and when to seek medical help.',
      reason: `Matched ${vectorMatches.join(', ')} from your latest report.`,
      tone: 'warning',
      icon: 'bug-outline',
      matchedSymptoms: vectorMatches,
      actions: [{ label: 'CDC tick-bite guide', type: 'link', target: RMSF_GUIDE, primary: true }],
      nationResources: TO_NATION_VECTOR_ENCOUNTER_RESOURCES,
    };
  }

  if (vectorPresenceMatches.length > 0) {
    return {
      title: 'Mosquito activity resources',
      summary: 'Mosquito activity has been reported, so these resources can help you track local conditions and learn about West Nile virus.',
      reason: `Matched ${vectorPresenceMatches.join(', ')} from your latest report.`,
      tone: 'warning',
      icon: 'bug-outline',
      matchedSymptoms: vectorPresenceMatches,
      actions: [
        { label: 'CDC West Nile guide', type: 'link', target: WEST_NILE_GUIDE, primary: true },
        { label: 'VectorSurv maps', type: 'link', target: VECTOR_SURV_MAP },
      ],
      nationResources: TO_NATION_VECTOR_PRESENCE_RESOURCES,
    };
  }

  if (iliMatches.length > 0) {
    return {
      title: 'Consider care for flu-like symptoms',
      summary: 'Your report looks consistent with a flu-like illness. Consider seeking care and check current respiratory activity in your area.',
      reason: `Matched ${iliMatches.join(', ')} from your latest report.`,
      tone: 'warning',
      icon: 'medkit-outline',
      matchedSymptoms: iliMatches,
      actions: [
        { label: 'Pima County data', type: 'link', target: PIMA_RESPIRATORY_DATA, primary: true },
        { label: 'Arizona dashboard', type: 'link', target: ARIZONA_RESPIRATORY_DASHBOARD },
      ],
    };
  }

  if (respiratoryMatches.length > 0) {
    return {
      title: 'Respiratory illness data for your area',
      summary: 'These links show current respiratory activity in Pima County and across Arizona.',
      reason: `Matched ${respiratoryMatches.join(', ')} from your latest report.`,
      tone: 'default',
      icon: 'analytics-outline',
      matchedSymptoms: respiratoryMatches,
      actions: [
        { label: 'Pima County data', type: 'link', target: PIMA_RESPIRATORY_DATA, primary: true },
        { label: 'Arizona dashboard', type: 'link', target: ARIZONA_RESPIRATORY_DASHBOARD },
      ],
      nationResources: TO_NATION_RESPIRATORY_RESOURCES,
    };
  }

  if (mildMatches.length > 0) {
    return {
      title: 'Current activity is the best next step',
      summary: 'Start with the activity map to see what others nearby are reporting right now.',
      reason: `Matched ${mildMatches.join(', ')} from your latest report.`,
      tone: 'default',
      icon: 'map-outline',
      matchedSymptoms: mildMatches,
      actions: [{ label: 'View current activity map', type: 'route', target: '/map', primary: true }],
    };
  }

  if (animalIllnessMatches.length > 0) {
    const birdRelated = animalIllnessMatches.includes('Dead birds nearby');

    return {
      title: 'Animal health resources',
      summary: 'For sick wildlife, dead birds, or other animal health concerns, these contacts can help you reach the right local agency.',
      reason: `Matched ${animalIllnessMatches.join(', ')} from your latest report.`,
      tone: 'warning',
      icon: 'paw-outline',
      matchedSymptoms: animalIllnessMatches,
      actions: [
        { label: 'AZ Game and Fish dispatch', type: 'call', target: AZ_GAME_AND_FISH_DISPATCH, primary: true },
        { label: 'Pima Animal Care Center', type: 'call', target: PIMA_ANIMAL_CARE_CENTER },
        { label: 'Pima rabies info', type: 'link', target: RABIES_INFO },
        ...(birdRelated ? [{ label: 'USDA sick bird hotline', type: 'call' as const, target: USDA_SICK_BIRD_HOTLINE }] : []),
        { label: 'Pima County rabies assessment', type: 'call', target: PIMA_HEALTH_RABIES },
      ],
      nationResources: TO_NATION_ANIMAL_ILLNESS_RESOURCES,
    };
  }

  if (report.feeling !== 'sick' || symptoms.length === 0) {
    return {
      title: 'Current activity near you',
      summary: 'See what people near you are reporting right now.',
      reason: 'Using your latest report to surface the general community view.',
      tone: 'default',
      icon: 'map-outline',
      matchedSymptoms: [],
      actions: [{ label: 'View current activity map', type: 'route', target: '/map', primary: true }],
    };
  }

  return {
    title: 'Start with current activity near you',
    summary: 'This is the best starting point based on your latest report.',
    reason: 'Using your latest report to suggest the closest match.',
    tone: 'default',
    icon: 'map-outline',
    matchedSymptoms: symptoms.slice(0, 3),
    actions: [{ label: 'View current activity map', type: 'route', target: '/map', primary: true }],
  };
}
