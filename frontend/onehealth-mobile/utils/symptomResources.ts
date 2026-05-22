import type { SavedReport } from './storage';

export interface ResourceAction {
  label: string;
  href?: string;
  route?: string;
  detail?: string;
}

export interface SymptomResourceRecommendation {
  title: string;
  summary: string;
  actions: ResourceAction[];
  nationResources?: ResourceAction[];
}

const TOHONO_NATION_ZIPS = new Set([
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

const PLACEHOLDER_PHONE = '(555) 555-5555';
const PIMA_RESPIRATORY_URL = 'https://www.pima.gov/3153/Respiratory-ILLNESS-Data';
const ARIZONA_RESPIRATORY_URL = 'https://www.azdhs.gov/preparedness/epidemiology-disease-control/infectious-disease-epidemiology/respiratory-illness/dashboards/index.php#respiratory-summary';
const RMSF_URL = 'https://www.cdc.gov/rocky-mountain-spotted-fever/about/index.html';
const PIMA_RABIES_URL = 'https://www.pima.gov/2868/Rabies';
const WEST_NILE_URL = 'https://www.cdc.gov/west-nile-virus/about/index.html';
const VECTOR_SURV_URL = 'https://maps.vectorsurv.org/arbo';

const phoneAction = (label: string, phone: string): ResourceAction => ({
  label,
  href: `tel:${phone.replace(/\D/g, '')}`,
  detail: phone,
});

const placeholderPhoneAction = (label: string): ResourceAction => phoneAction(label, PLACEHOLDER_PHONE);

const linkAction = (label: string, href: string, detail?: string): ResourceAction => ({
  label,
  href,
  detail,
});

const mapAction = (label = 'Open the activity map'): ResourceAction => ({
  label,
  route: '/(tabs)/map',
  detail: 'See recent reports and activity near you',
});

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const joinText = (...values: (string | string[] | undefined | null)[]) => values
  .flatMap((value) => Array.isArray(value) ? value : [value || ''])
  .filter((value) => typeof value === 'string' && value.trim().length > 0)
  .join(' ')
  .toLowerCase();

const includesAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const hasSymptom = (report: SavedReport, symptomIds: string[]) => (
  report.symptoms?.some((symptom) => symptomIds.includes(symptom)) || false
);

const getRespiratoryNationResources = (): ResourceAction[] => [
  phoneAction('DHHS Community Health Services', '(520) 383-6200'),
  placeholderPhoneAction('TOHC Public Health Nursing'),
];

const getTickNationResources = (): ResourceAction[] => [
  phoneAction('DHHS Community Health Services', '(520) 383-6200'),
  placeholderPhoneAction('TOHC Public Health Nursing'),
  phoneAction('TOHC Environmental Health (Phoenix Indian Medical Center)', '(602) 263-1200'),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Range Conservation"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Veterinary Clinic"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Livestock Inspectors"),
];

const getAnimalBiteNationResources = (): ResourceAction[] => [
  phoneAction('TOHC Environmental Health (Phoenix Indian Medical Center)', '(602) 263-1200'),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Animal Control"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Livestock Inspectors"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Range Conservation"),
];

const getAnimalIllnessNationResources = (): ResourceAction[] => [
  phoneAction('TOHC Environmental Health (Phoenix Indian Medical Center)', '(602) 263-1200'),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Animal Control"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Veterinary Clinic"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Livestock Inspectors"),
  placeholderPhoneAction("Tohono O'odham Natural Resources - Range Conservation"),
];

const getVectorNationResources = (): ResourceAction[] => [
  placeholderPhoneAction('TONDHHS CHS & Epidemiology'),
  placeholderPhoneAction('TOHC Environmental Health'),
];

export const isTohonoNationZip = (zip?: string | null) => TOHONO_NATION_ZIPS.has((zip || '').trim());

export function getSymptomResourceRecommendation(report?: SavedReport | null): SymptomResourceRecommendation | null {
  if (!report) return null;

  const category = report.category || [];
  const symptoms = report.symptoms || [];
  const animalTypes = report.animalTypes || [];
  const animalObservations = report.animalObservations || [];
  const environmentObservations = report.environmentObservations || [];
  const generalObservations = report.observations || [];

  const humanText = joinText(symptoms, report.otherSymptomText, report.onset);
  const animalText = joinText(
    animalTypes,
    animalObservations,
    generalObservations,
    report.animalSpecies,
    report.animalOtherIncidentDetails,
    report.animalNotes,
  );
  const environmentText = joinText(
    environmentObservations,
    generalObservations,
    report.environmentNotes,
    report.environmentVectorDensity,
  );
  const combinedText = joinText(humanText, animalText, environmentText);

  const hasAnimalBite = includesAny(combinedText, [
    'animal bite',
    'dog bite',
    'dog bit',
    'bit by dog',
    'bitten by dog',
    'cat bite',
    'cat bit',
    'bit by cat',
    'bitten by cat',
    'bat bite',
    'bitten by bat',
    'coyote bite',
    'wildlife bite',
  ]);

  const hasTickOrInsectBite = includesAny(combinedText, [
    'tick bite',
    'bit by tick',
    'bitten by tick',
    'tick attached',
    'insect bite',
    'bug bite',
    'bitten by bug',
    'mosquito bite',
  ]);

  const hasAnimalIllness = category.includes('animals') && (
    animalObservations.length > 0 ||
    includesAny(animalText, [
      'sick animal',
      'sick animals',
      'sudden sickness',
      'found dead',
      'dead bird',
      'dead birds',
      'unusual behavior',
      'livestock incident',
    ])
  );

  const hasVectorPresence = category.includes('environment') && (
    environmentObservations.includes('Vector spotting') ||
    includesAny(environmentText, [
      'vector spotting',
      'mosquito',
      'mosquitos',
      'mosquitoes',
      'tick',
      'ticks',
      'swarm',
      'biting insects',
    ])
  );

  const hasSevereSymptoms = hasSymptom(report, [
    'Difficulty Breathing',
    'Yellow Skin/Yellow Eyes',
    'Discolored Or Bloody Urine',
    'Bleeding From Body Openings',
  ]) || includesAny(humanText, [
    'difficulty breathing',
    'shortness of breath',
    'hard to breathe',
    'yellow skin',
    'yellow eyes',
    'bloody urine',
    'blood in urine',
    'bleeding',
  ]);

  const hasILI = hasSymptom(report, [
    'Fever',
    'Rash',
    'Chills',
    'Muscle Or Body Aches And Pain',
  ]) || includesAny(humanText, [
    'fever',
    'rash',
    'chills',
    'body ache',
    'body aches',
    'muscle ache',
    'muscle aches',
  ]);

  const hasRespiratorySymptoms = hasSymptom(report, [
    'Cough/Congestion',
    'Sore Throat',
  ]) || includesAny(humanText, [
    'cough',
    'congestion',
    'congested',
    'sore throat',
    'scratchy throat',
  ]);

  const hasOtherMildSymptoms = hasSymptom(report, [
    'Diarrhea',
    'Nausea/Vomiting',
    'Loss Of Smell Or Taste',
    'Red Eyes',
  ]) || includesAny(humanText, [
    'diarrhea',
    'nausea',
    'vomiting',
    'loss of smell',
    'loss of taste',
    'red eyes',
  ]);

  if (hasAnimalBite) {
    const wildlifeRelated = animalTypes.includes('Wildlife') || includesAny(combinedText, ['bat', 'coyote', 'fox', 'wildlife']);
    const actions: ResourceAction[] = [
      linkAction('Pima rabies info', PIMA_RABIES_URL),
      phoneAction('Pima County rabies assessment', '(520) 724-7797'),
      phoneAction('Pima Animal Care Center', '(520) 724-5900'),
    ];

    if (wildlifeRelated) {
      actions.push(phoneAction('AZ Game and Fish dispatch', '(623) 236-7201'));
    }

    return {
      title: 'Animal bite resources',
      summary: 'Animal bites can transmit rabies. These resources can help with next steps.',
      actions,
      nationResources: getAnimalBiteNationResources(),
    };
  }

  if (hasSevereSymptoms) {
    return {
      title: 'Get urgent help',
      summary: 'These symptoms may need urgent medical attention. If you are experiencing a medical emergency, call 911.',
      actions: [],
    };
  }

  if (hasTickOrInsectBite) {
    return {
      title: 'Tick or insect bite guidance',
      summary: 'Tick and insect bites can carry health risks. Review what to watch for and when to seek care.',
      actions: [linkAction('CDC Rocky Mountain spotted fever guidance', RMSF_URL)],
      nationResources: getTickNationResources(),
    };
  }

  if (hasAnimalIllness) {
    const poultryRelated = animalTypes.includes('Poultry') || includesAny(animalText, ['poultry', 'chicken', 'duck', 'turkey']);
    const birdRelated = poultryRelated || animalTypes.includes('Birds') || includesAny(animalText, ['bird', 'birds']);
    const actions: ResourceAction[] = [
      phoneAction('AZ Game and Fish dispatch', '(623) 236-7201'),
      phoneAction('Pima Animal Care Center', '(520) 724-5900'),
    ];

    if (birdRelated) {
      actions.push(phoneAction('USDA sick bird hotline', '(866) 536-7593'));
    }

    return {
      title: 'Animal illness and death reporting',
      summary: 'Sick or dead animals can be important public health signals. Report wildlife or poultry concerns to the right team.',
      actions,
      nationResources: getAnimalIllnessNationResources(),
    };
  }

  if (hasVectorPresence) {
    return {
      title: 'Mosquito and vector activity',
      summary: 'Unusual mosquito or vector activity can help explain local risk. Check current West Nile and mosquito surveillance data.',
      actions: [
        linkAction('CDC West Nile information', WEST_NILE_URL),
        linkAction('VectorSurv mosquito map', VECTOR_SURV_URL),
      ],
      nationResources: getVectorNationResources(),
    };
  }

  if (hasILI) {
    return {
      title: 'Flu-like symptoms',
      summary: 'These symptoms can line up with flu-like illness. Consider care if symptoms are getting worse, and check what is circulating locally.',
      actions: [
        linkAction('Pima County respiratory illness data', PIMA_RESPIRATORY_URL),
        linkAction('Arizona respiratory summary', ARIZONA_RESPIRATORY_URL),
      ],
    };
  }

  if (hasRespiratorySymptoms) {
    return {
      title: 'Respiratory illness data',
      summary: 'Local respiratory tracking can help you see what is circulating in Pima County and across Arizona.',
      actions: [
        linkAction('Pima County respiratory illness data', PIMA_RESPIRATORY_URL),
        linkAction('Arizona respiratory summary', ARIZONA_RESPIRATORY_URL),
      ],
      nationResources: getRespiratoryNationResources(),
    };
  }

  if (hasOtherMildSymptoms) {
    return {
      title: 'Check local activity',
      summary: 'You can check the live map for nearby activity while you monitor how you feel.',
      actions: [mapAction()],
    };
  }

  if (normalize(report.feeling) === 'good') {
    return {
      title: 'Current activity near you',
      summary: 'You can use the map to see nearby reports and community activity in your area.',
      actions: [mapAction()],
    };
  }

  return {
    title: 'Current activity near you',
    summary: 'You can use the map to see nearby reports and community activity in your area.',
    actions: [mapAction()],
  };
}
