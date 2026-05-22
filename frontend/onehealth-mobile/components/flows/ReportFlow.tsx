import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Image,
  Animated, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Modal, useColorScheme, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getLang, saveReport, setLang as setStorageLang, setUserZip } from '@/utils/storage';

// ─── Theme — matches OneHealth splash ────────────────────────
const P = {
  light: {
    bg: '#FAFAFA', card: '#FFFFFF', text: '#111', sub: '#888',
    hint: '#B0B0B0', line: '#EEEEEE', fill: '#F2F2F2',
    accent: '#0B6623', accentSoft: '#F0F7F1', accentMid: '#D5E8D4',
    sel: '#111', selBg: '#F0F0F0',
    inv: '#FFF', green: '#0B6623', bar: 'dark' as const,
  },
  dark: {
    bg: '#000', card: '#111', text: '#EEE', sub: '#888',
    hint: '#444', line: '#1A1A1A', fill: '#1A1A1A',
    accent: '#4CAF50', accentSoft: '#162016', accentMid: '#1E331E',
    sel: '#EEE', selBg: '#222',
    inv: '#FFF', green: '#4CAF50', bar: 'light' as const,
  },
};
type Th = any;

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const appendReportNote = (current: string, next: string) => current ? `${current}\n${next}` : next;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad2 = (value: number) => String(value).padStart(2, '0');
const formatCalendarDate = (date: Date) => `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()}`;

const parseCalendarDate = (value: string) => {
  const clean = value.trim();
  if (!clean) return null;
  const normalized = clean.toLowerCase();
  const today = new Date();
  if (normalized === 'today') return today;
  if (normalized === 'yesterday') return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (normalized === 'last week') return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

  const parts = clean.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?$/);
  if (!parts) return null;
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const year = parts[3] ? Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]) : today.getFullYear();
  const parsed = new Date(year, month, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
  return parsed;
};

const getCalendarDays = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= lastDate; day += 1) {
    days.push(new Date(year, month, day));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
};

const sameCalendarDay = (a: Date | null, b: Date | null) => (
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
);

const inferIncidentDate = (text: string) => {
  const normalized = text.toLowerCase();
  const explicitDate = text.match(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/);
  if (explicitDate) return formatCalendarDate(parseCalendarDate(explicitDate[0]) || new Date());
  const today = new Date();
  if (normalized.includes('yesterday')) return formatCalendarDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
  if (normalized.includes('today')) return formatCalendarDate(today);
  if (normalized.includes('last week')) return formatCalendarDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
  return '';
};

const inferFirstNumber = (text: string) => text.match(/\b\d+\b/)?.[0] || '';

const inferSpecies = (text: string) => {
  const normalized = text.toLowerCase();
  const species = ['dog', 'cat', 'cow', 'cattle', 'horse', 'goat', 'sheep', 'pig', 'chicken', 'duck', 'turkey', 'bird', 'bat', 'deer', 'rabbit', 'mouse', 'rat', 'snake', 'lizard', 'fish'];
  const match = species.find((item) => normalized.includes(item));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : '';
};

const SYMPTOMS = [
  { id: 'Cough/Congestion', color: '#2F80ED', badge: require('@/assets/images/symptom-badges/cough-congestion.png') },
  { id: 'Nausea/Vomiting', color: '#7B61FF', badge: require('@/assets/images/symptom-badges/nausea-vomiting.png') },
  { id: 'Difficulty Breathing', color: '#0E9F6E', badge: require('@/assets/images/symptom-badges/difficulty-breathing.png') },
  { id: 'Sore Throat', color: '#D97706', badge: require('@/assets/images/symptom-badges/sore-throat.png') },
  { id: 'Rash', color: '#EC4899', badge: require('@/assets/images/symptom-badges/rash.png') },
  { id: 'Fever', color: '#DC2626', badge: require('@/assets/images/symptom-badges/fever.png') },
  { id: 'Chills', color: '#0891B2', badge: require('@/assets/images/symptom-badges/chills.png') },
  { id: 'Diarrhea', color: '#2563EB', badge: require('@/assets/images/symptom-badges/diarrhea.png') },
  { id: 'Bleeding From Body Openings', color: '#B91C1C', badge: require('@/assets/images/symptom-badges/bleeding.png') },
  { id: 'Red Eyes', color: '#EF4444', badge: require('@/assets/images/symptom-badges/red-eyes.png') },
  { id: 'Muscle Or Body Aches And Pain', color: '#9333EA', badge: require('@/assets/images/symptom-badges/body-aches.png') },
  { id: 'Discolored Or Bloody Urine', color: '#A16207', badge: require('@/assets/images/symptom-badges/bloody-urine.png') },
  { id: 'Loss Of Smell Or Taste', color: '#EA580C', badge: require('@/assets/images/symptom-badges/loss-smell-taste.png') },
  { id: 'Yellow Skin/Yellow Eyes', color: '#CA8A04', badge: require('@/assets/images/symptom-badges/yellow-skin-eyes.png') },
  { id: 'Other', color: '#64748B', badge: require('@/assets/images/symptom-badges/other.png') },
];
const ONSET = ['Today', 'Yesterday', 'This week', 'Last week'];
const OBSERVATIONS = [
  { id: 'Sudden sickness', icon: 'medical-outline' as keyof typeof Ionicons.glyphMap, categories: ['animals'] },
  { id: 'Found dead', icon: 'skull-outline' as keyof typeof Ionicons.glyphMap, categories: ['animals'] },
  { id: 'Unusual behavior', icon: 'alert-circle-outline' as keyof typeof Ionicons.glyphMap, categories: ['animals'] },
  { id: 'Other', icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap, categories: ['animals'] },
  { id: 'Water flooding', icon: 'water-outline' as keyof typeof Ionicons.glyphMap, categories: ['environment'] },
  { id: 'Water contamination', icon: 'flask-outline' as keyof typeof Ionicons.glyphMap, categories: ['environment'] },
  { id: 'Vector spotting', icon: 'bug-outline' as keyof typeof Ionicons.glyphMap, categories: ['environment'] },
  { id: 'Other', icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap, categories: ['environment'] }
];
const ANIMAL_TYPES = [
  { id: 'Pets', icon: 'home-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/pets.png'), terms: ['pet', 'dog', 'cat', 'rabbit'] },
  { id: 'Livestock', icon: 'business-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/livestock.png'), terms: ['livestock', 'cow', 'cattle', 'horse', 'goat', 'sheep', 'pig'] },
  { id: 'Wildlife', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/wildlife.png'), terms: ['wildlife', 'wild', 'deer', 'coyote', 'bat', 'fox'] },
  { id: 'Birds', icon: 'egg-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/birds.png'), terms: ['bird', 'birds', 'pigeon', 'dove', 'crow'] },
  { id: 'Poultry', icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/poultry.png'), terms: ['poultry', 'chicken', 'duck', 'turkey'] },
  { id: 'Mosquitos', icon: 'bug-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/mosquitos.png'), terms: ['mosquito', 'mosquitoes', 'mosquitos'] },
  { id: 'Rodents', icon: 'bug-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/rodents.png'), terms: ['rodent', 'mouse', 'mice', 'rat', 'rats'] },
  { id: 'Reptiles', icon: 'fish-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/reptiles.png'), terms: ['reptile', 'snake', 'lizard', 'turtle'] },
  { id: 'Other', icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap, badge: require('@/assets/images/animal-type-badges/other.png'), terms: [] },
];
type VoiceTarget = 'symptoms' | 'animals' | 'environment';
type DatePickerTarget = 'animal' | 'environment';
const SYMPTOM_RULES = [
  { id: 'Cough/Congestion', terms: ['cough', 'congestion', 'congested', 'stuffy', 'runny nose', 'sneezing'] },
  { id: 'Nausea/Vomiting', terms: ['nausea', 'nauseous', 'vomit', 'vomiting', 'throwing up'] },
  { id: 'Difficulty Breathing', terms: ['difficulty breathing', 'shortness of breath', 'hard to breathe', 'wheezing', 'cannot breathe'] },
  { id: 'Sore Throat', terms: ['sore throat', 'throat hurts', 'scratchy throat'] },
  { id: 'Rash', terms: ['rash', 'hives', 'spots', 'skin bumps'] },
  { id: 'Fever', terms: ['fever', 'temperature', 'hot', 'high temp'] },
  { id: 'Chills', terms: ['chills', 'shivering', 'shiver'] },
  { id: 'Diarrhea', terms: ['diarrhea', 'loose stool', 'watery stool'] },
  { id: 'Bleeding From Body Openings', terms: ['bleeding', 'blood from', 'bloody nose', 'blood in mouth', 'blood in stool'] },
  { id: 'Red Eyes', terms: ['red eyes', 'pink eye', 'eye redness', 'bloodshot'] },
  { id: 'Muscle Or Body Aches And Pain', terms: ['muscle ache', 'body ache', 'body pain', 'aches', 'pain all over'] },
  { id: 'Discolored Or Bloody Urine', terms: ['urine', 'pee', 'bloody urine', 'blood in urine', 'dark urine', 'discolored urine'] },
  { id: 'Loss Of Smell Or Taste', terms: ['loss of smell', 'loss of taste', 'cannot smell', 'cannot taste', 'no smell', 'no taste'] },
  { id: 'Yellow Skin/Yellow Eyes', terms: ['yellow skin', 'yellow eyes', 'jaundice'] },
];

const I18N = {
  EN: {
    back: 'Back',
    feeling_h: 'How are you\nfeeling today?', feeling_s: 'Your report helps Arizona detect health threats early.',
    sick: 'Not Feeling Good', sick_d: 'Report symptoms and details',
    good: 'Feeling Good', good_d: 'Report environmental or animal observations',
    cat_h: 'What is this\nabout?', cat_s: 'Select all that apply.',
    people: 'People', people_d: 'Yourself, family, or friends',
    report_about: 'Who are you reporting about?', report_self: 'Myself', report_someone_else: 'Someone else',
    animals: 'Animals', animals_d: 'Pets, farm animals, or wildlife',
    env: 'Environment', env_d: 'Water, air, plants, or places',
    lang_theme: 'Language & Theme', sel_lang: 'Select Language',
    appearance: 'Appearance', light: 'Light', dark: 'Dark',
    sym_h: 'What symptoms\nare you having?', desc_sym: 'Describe symptom…',
    how_many: 'How many people are sick?', where: 'Where are you located?',
    zip: 'Zip code', detect: 'Detect', photo_h: 'Optional photo',
    photo_add: 'Tap to add photo', photo_added: 'Photo attached',
    more_h: 'A few more\ndetails', more_s: 'This helps our analysis.',
    when_start: 'When did symptoms start?', prof_diag: 'Were you professionally diagnosed?',
    yes: 'Yes', no: 'No', no_doc: "Haven't seen a doctor",
    what_diag: 'What were you diagnosed with?',
    impact: 'Impact', absent_work_school: 'Absent from work/school',
    obs_h: 'What have you\nobserved?', obs_s: 'Report anything unusual in your environment.',
    loc: 'Your location', notes: 'Notes (optional)', any_det: 'Any additional details…',
    thanks: 'Thank you!', rep_near: 'Reports near you this week', pima: 'across Pima County',
    view_map: 'View Map', rep_anon: 'Report Another', signup: 'Sign Up to Track Reports',
    submit: 'Submit Report', continue: 'Continue',

    sym: { 'Cough/Congestion':'Cough/Congestion', 'Nausea/Vomiting':'Nausea/Vomiting', 'Difficulty Breathing':'Difficulty breathing', 'Sore Throat':'Sore throat', 'Rash':'Rash', 'Fever':'Fever', 'Chills':'Chills', 'Diarrhea':'Diarrhea', 'Bleeding From Body Openings':'Bleeding from body openings', 'Red Eyes':'Red eyes', 'Muscle Or Body Aches And Pain':'Muscle or body aches and pain', 'Discolored Or Bloody Urine':'Discolored or bloody urine', 'Loss Of Smell Or Taste':'Loss of smell or taste', 'Yellow Skin/Yellow Eyes':'Yellow skin/yellow eyes', 'Other':'Other' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Strep Throat', 'RSV':'RSV', 'Valley Fever':'Valley Fever', 'Other':'Other' },
    ons: { 'Today':'Today', 'Yesterday':'Yesterday', 'This week':'This week', 'Last week':'Last week' },
    obs: { 'Dead birds nearby':'Dead birds nearby', 'Sick animals':'Sick animals', 'Sudden sickness':'Sudden sickness', 'Found dead':'Found dead', 'Unusual behavior':'Unusual behavior', 'Multiple animals affected':'Multiple animals affected', 'Unusual mosquito activity':'Unusual mosquito activity', 'Water flooding':'Water flooding', 'Water contamination':'Water contamination', 'Vector spotting':'Vector spotting', 'Other':'Other', 'Nothing unusual':'Nothing unusual' },
  },
  ES: {
    back: 'Atrás',
    feeling_h: '¿Cómo te\nsientes hoy?', feeling_s: 'Tu reporte ayuda a detectar amenazas de salud.',
    sick: 'Me siento enfermo', sick_d: 'Reportar síntomas y detalles',
    good: 'Me siento bien', good_d: 'Reportar observaciones del entorno',
    cat_h: '¿De qué\nse trata?', cat_s: 'Selecciona todo lo que aplique.',
    people: 'Personas', people_d: 'Tú, familia o amigos',
    report_about: '¿Sobre quién estás reportando?', report_self: 'Yo', report_someone_else: 'Alguien más',
    animals: 'Animales', animals_d: 'Mascotas o vida silvestre',
    env: 'Entorno', env_d: 'Agua, aire, plantas o lugares',
    lang_theme: 'Idioma y Tema', sel_lang: 'Seleccionar Idioma',
    appearance: 'Apariencia', light: 'Claro', dark: 'Oscuro',
    sym_h: '¿Qué síntomas\ntienes?', desc_sym: 'Describe el síntoma…',
    how_many: '¿Cuántas personas están enfermas?', where: '¿Dónde te encuentras?',
    zip: 'Código postal', detect: 'Detectar', photo_h: 'Foto opcional',
    photo_add: 'Toca para añadir', photo_added: 'Foto adjunta',
    more_h: 'Algunos\ndetalles más', more_s: 'Esto ayuda a nuestro análisis.',
    when_start: '¿Cuándo empezaron?', prof_diag: '¿Fuiste diagnosticado?',
    yes: 'Sí', no: 'No', no_doc: "No he visto a un médico",
    what_diag: '¿Cuál fue tu diagnóstico?',
    impact: 'Impacto', absent_work_school: 'Ausente del trabajo/escuela',
    obs_h: '¿Qué has\nobservado?', obs_s: 'Reporta algo inusual en tu entorno.',
    loc: 'Tu ubicación', notes: 'Notas (opcional)', any_det: 'Detalles adicionales…',
    thanks: '¡Gracias!', rep_near: 'Reportes cerca de ti esta semana', pima: 'en todo el condado',
    view_map: 'Ver Mapa', rep_anon: 'Reportar Otro', signup: 'Regístrate para ver',
    submit: 'Enviar Reporte', continue: 'Continuar',

    sym: { 'Cough':'Tos', 'Fever':'Fiebre', 'Very Tired':'Muy cansado', 'Nausea':'Náuseas', 'Headache':'Dolor de cabeza', 'Body Aches':'Dolores musculares', 'Sore Throat':'Dolor de garganta', 'Other':'Otro' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Faringitis estreptocócica', 'RSV':'VSR', 'Valley Fever':'Fiebre del Valle', 'Other':'Otro' },
    ons: { 'Today':'Hoy', 'Yesterday':'Ayer', 'This week':'Esta semana', 'Last week':'La semana pasada' },
    obs: { 'Dead birds nearby':'Pájaros muertos', 'Sick animals':'Animales enfermos', 'Unusual mosquito activity':'Actividad inusual de mosquitos', 'Water issues':'Problemas de agua', 'Air quality concerns':'Calidad del aire', 'Nothing unusual':'Nada inusual' },
  },
  TO: {
    back: 'Atrás',
    feeling_h: 'Shaču p-e-ta:tk\ne-da:m?', feeling_s: 'E-a:ga o a:pi e-ñiok.',
    sick: 'S-ko:k', sick_d: 'A:g haicu s-ko:k',
    good: 'S-ape', good_d: 'A:g haicu s-ape',
    cat_h: 'Haicu ahu\ni:da?', cat_s: 'A:g haicu.',
    people: 'Hemaajkam', people_d: 'A:pi, ha-ñiok',
    report_about: 'Who is this about?', report_self: 'Myself', report_someone_else: 'Someone else',
    animals: "Ha'icu doakam", animals_d: 'Gogs, cewag',
    env: 'Jewed', env_d: 'Su:dagi, jewed',
    lang_theme: 'Ñiok & Theme', sel_lang: 'Ñiok',
    appearance: 'Appearance', light: 'Light', dark: 'Dark',
    sym_h: 'Shaču s-ko:k?', desc_sym: 'A:g...',
    how_many: 'He\'ekia hemaajkam s-ko:k?', where: 'Hebai ap?',
    zip: 'Zip code', detect: 'S-mah', photo_h: 'Koaia',
    photo_add: 'Tatk koaia', photo_added: 'Koaia ap',
    more_h: 'Haicu ha-we:hejed', more_s: 'Ap s-ap.',
    when_start: 'He\'ekia ta:tk?', prof_diag: 'Ma:cina?',
    yes: 'Hau', no: 'Pi\'a', no_doc: "Pi ha-ñiok doctor",
    what_diag: 'Shaču ap ma:cina?',
    impact: 'Impact', absent_work_school: 'Absent from work/school',
    obs_h: 'Shaču ap\nñei?', obs_s: 'A:g haicu.',
    loc: 'Hebai ap', notes: 'Haicu (cem)', any_det: 'A:g...',
    thanks: 'M-s-ap\'e!', rep_near: 'Haicu e-we:hejed', pima: 'Pima County',
    view_map: 'Ñei Map', rep_anon: 'A:g haicu', signup: 'O\'ohan',
    submit: 'Submit', continue: 'Continue',

    sym: { 'Cough':'I:ho', 'Fever':'S-ton', 'Very Tired':'S-gehge', 'Nausea':'S-ko:k e-da', 'Headache':'Mo\'o s-ko:k', 'Body Aches':'Cuhug s-ko:k', 'Sore Throat':'Ba:ñ s-ko:k', 'Other':'Haicu' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Strep Throat', 'RSV':'RSV', 'Valley Fever':'Valley Fever', 'Other':'Other' },
    ons: { 'Today':'I:da task', 'Yesterday':'Tako', 'This week':'I:da domig', 'Last week':'Vepag domig' },
    obs: { 'Dead birds nearby':'Muu cewag', 'Sick animals':'S-ko:k ha\'icu', 'Unusual mosquito activity':'Vamc s-mu\'i', 'Water issues':'Su:dagi pi-ap', 'Air quality concerns':'Hevel pi-ap', 'Nothing unusual':'Pi haicu' },
  }
};

// ─────────────────────────────────────────────────────────────
type ReportFlowProps = {
  onSignUp?: () => void | Promise<void>;
  onReportSubmitted?: () => void | Promise<void>;
  onReturnHome?: () => void | Promise<void>;
  onSubmitComplete?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
};

export default function ReportFlow({ onSignUp, onReportSubmitted, onReturnHome, onSubmitComplete, onClose }: ReportFlowProps) {
  const sys = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const t = P[mode];
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const compactPhone = windowWidth >= 390 && windowHeight >= 820;
  const pageX = compactPhone ? 24 : 22;
  const fieldGapTop = compactPhone ? 18 : 24;
  const scrollBottom = compactPhone ? 34 : 40;
  const headerTop = compactPhone ? 10 : 6;
  const headerBottom = compactPhone ? 16 : 20;
  const footerTop = compactPhone ? 10 : 8;
  const footerBottom = compactPhone ? 22 : 16;
  const formShellStyle = { flex: 1, width: '100%' as const, maxWidth: compactPhone ? 414 : 430, alignSelf: 'center' as const };

  const [lang, setLangState] = useState<'EN' | 'ES' | 'TO'>('EN');
  const loc = I18N[lang];
  
  useEffect(() => {
    getLang().then(l => setLangState(l as 'EN' | 'ES' | 'TO'));
  }, []);

  const [showSettings, setShowSettings] = useState(false);
  const settingsAnim = useRef(new Animated.Value(0)).current;

  const toggleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showSettings ? 0 : 1;
    if (!showSettings) setShowSettings(true);
    Animated.spring(settingsAnim, { toValue, tension: 60, friction: 8, useNativeDriver: true }).start(() => {
      if (showSettings) setShowSettings(false);
    });
  };

  const [step, setStep] = useState(0);

  // Data
  const [feeling, setFeeling] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [reportSubject, setReportSubject] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSym, setOtherSym] = useState('');
  const [sickCount, setSickCount] = useState('1');
  const [zip, setZip] = useState('');
  const [locL, setLocL] = useState(false);
  const [onset, setOnset] = useState('');
  const [diagnosed, setDiagnosed] = useState('');
  const [absentFromWorkSchool, setAbsentFromWorkSchool] = useState('');
  const [animalObservations, setAnimalObservations] = useState<string[]>([]);
  const [environmentObservations, setEnvironmentObservations] = useState<string[]>([]);
  const [animalTypes, setAnimalTypes] = useState<string[]>([]);
  const [animalIncidentDate, setAnimalIncidentDate] = useState('');
  const [animalZip, setAnimalZip] = useState('');
  const [animalSpecies, setAnimalSpecies] = useState('');
  const [animalAffectedCount, setAnimalAffectedCount] = useState('1');
  const [animalPhoto, setAnimalPhoto] = useState<string | null>(null);
  const [animalOtherIncidentDetails, setAnimalOtherIncidentDetails] = useState('');
  const [environmentIncidentDate, setEnvironmentIncidentDate] = useState('');
  const [environmentZip, setEnvironmentZip] = useState('');
  const [environmentVectorDensity, setEnvironmentVectorDensity] = useState('');
  const [environmentPhoto, setEnvironmentPhoto] = useState<string | null>(null);
  const [animalNotes, setAnimalNotes] = useState('');
  const [environmentNotes, setEnvironmentNotes] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [listening, setListening] = useState(false);
  const [analyzingSymptoms, setAnalyzingSymptoms] = useState(false);
  const [showVoiceCapture, setShowVoiceCapture] = useState<VoiceTarget | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const fa = useRef(new Animated.Value(1)).current;
  const sl = useRef(new Animated.Value(0)).current;
  const speechRecognitionRef = useRef<any>(null);
  const holdingVoiceRef = useRef(false);
  const voiceTextRef = useRef('');
  const activeVoiceTargetRef = useRef<VoiceTarget>('symptoms');
  const stepRef = useRef(step);
  stepRef.current = step;

  const usesHumanSymptomFlow = cats.includes('people');
  const usesAnimalFlow = cats.includes('animals');
  const usesEnvironmentFlow = cats.includes('environment');
  const skipsDetailsForGood = feeling === 'good' && cats.length === 0;

  // Dynamic steps based on feeling and selected report category.
  const steps = [
    'feeling',
    ...(feeling ? ['category'] : []),
    ...(usesHumanSymptomFlow ? ['symptoms', 'assessment'] : []),
    ...(usesAnimalFlow ? ['animalObservations'] : []),
    ...(usesEnvironmentFlow ? ['environmentObservations'] : []),
    'done',
  ];

  const visibleSteps = steps.filter((stepName) => stepName !== 'done');
  const totalSteps = visibleSteps.length;
  const currentStepName = steps[step] || 'done';
  const currentVisibleStep = Math.min(step + 1, totalSteps);
  const animalObservationOptions = OBSERVATIONS.filter((option) => option.categories.includes('animals'));
  const environmentObservationOptions = OBSERVATIONS.filter((option) => option.categories.includes('environment'));
  const visibleObservations = currentStepName === 'animalObservations' ? animalObservationOptions : environmentObservationOptions;
  const observations = currentStepName === 'animalObservations' ? animalObservations : environmentObservations;
  const setObservations = currentStepName === 'animalObservations' ? setAnimalObservations : setEnvironmentObservations;
  const goodNotes = currentStepName === 'animalObservations' ? animalNotes : environmentNotes;
  const setGoodNotes = currentStepName === 'animalObservations' ? setAnimalNotes : setEnvironmentNotes;
  const observationHeading = currentStepName === 'animalObservations' ? loc.animals : loc.env;
  const observationSub = currentStepName === 'animalObservations' ? loc.animals_d : loc.env_d;

  const go = useCallback((n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = n > stepRef.current ? 1 : -1;
    Animated.parallel([
      Animated.timing(fa, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(sl, { toValue: -14 * d, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      setStep(n);
      sl.setValue(14 * d);
      // Wait a short delay for React to render the new screen while invisible
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fa, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(sl, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
      }, 50);
    });
  }, []);

  const togArr = (arr: string[], set: any, v: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set((p: string[]) => p.includes(v) ? p.filter((x: string) => x !== v) : [...p, v]);
  };

  const toggleAnimalObservation = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnimalObservations((prev) => {
      const next = prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value];
      if (value === 'Other' && !next.includes('Other')) setAnimalOtherIncidentDetails('');
      return next;
    });
  };

  const getZip = async (setZipValue: (value: string) => void = setZip) => {
    setLocL(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed'); setLocL(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const g = await Location.reverseGeocodeAsync(loc.coords);
      if (g[0]?.postalCode) setZipValue(g[0].postalCode.replace(/\D/g, '').slice(0, 5));
    } catch { Alert.alert('Error', 'Could not detect location'); }
    setLocL(false);
  };

  const takePhoto = async (setPhoto: (value: string | null) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Photo', 'Camera permission is needed to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
    } catch {
      Alert.alert('Photo', 'Could not open the camera.');
    }
  };

  const submit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const animalObservationIds = animalObservations.filter((obs) => animalObservationOptions.some((option) => option.id === obs));
    const environmentObservationIds = environmentObservations.filter((obs) => environmentObservationOptions.some((option) => option.id === obs));
    const hasEnvironmentIncident = (incident: string) => environmentObservationIds.includes(incident);
    const reportZip = zip || animalZip || environmentZip;
    const submittedAt = new Date().toISOString();
    const reportId = uid();
    const payload = {
      feeling,
      category: cats,
      zip_code: reportZip,
      submitted_at: submittedAt, id: reportId,
      ...(usesHumanSymptomFlow ? {
        reporting_for: reportSubject || null,
        symptoms: symptoms.map(s => s.toLowerCase()),
        other_symptom_text: symptoms.includes('Other') ? otherSym : null,
        people_sick_count: parseInt(sickCount) || 1,
        symptom_start: onset.toLowerCase(),
        professionally_diagnosed: diagnosed === 'Yes' ? true : diagnosed === 'No' ? false : null,
        absent_from_work_school: absentFromWorkSchool === 'Yes' ? true : absentFromWorkSchool === 'No' ? false : null,
      } : {}),
      ...(usesAnimalFlow ? {
        animal_types: animalTypes,
        animal_incident_date: animalIncidentDate || null,
        animal_location_zip: animalZip,
        animal_species: animalSpecies || null,
        animal_affected_count: parseInt(animalAffectedCount, 10) || null,
        animal_observations: animalObservationIds,
        animal_other_incident_details: animalObservations.includes('Other') ? animalOtherIncidentDetails || null : null,
        animal_notes: animalNotes || null,
        animal_photo_uri: animalPhoto,
      } : {}),
      ...(usesEnvironmentFlow ? {
        environment_incident_date: environmentIncidentDate || null,
        environment_location_zip: environmentZip,
        unusual_vector_presence: hasEnvironmentIncident('Vector spotting') ? true : null,
        vector_density_or_number: environmentVectorDensity || null,
        flooding: hasEnvironmentIncident('Water flooding') ? true : null,
        water_contamination: hasEnvironmentIncident('Water contamination') ? true : null,
        environment_observations: environmentObservationIds,
        environment_notes: environmentNotes || null,
        environment_photo_uri: environmentPhoto,
      } : {}),
    };
    console.log('Report:', JSON.stringify(payload, null, 2));

    const submittedDate = new Date(submittedAt);
    const observationIds = [...animalObservationIds, ...environmentObservationIds];

    try {
      await saveReport({
        id: reportId,
        feeling,
        category: cats,
        symptoms: usesHumanSymptomFlow ? symptoms : undefined,
        observations: observationIds.length > 0 ? observationIds : undefined,
        zip: reportZip,
        date: `${MONTH_NAMES[submittedDate.getMonth()]} ${submittedDate.getDate()}, ${submittedDate.getFullYear()}`,
        submittedAt,
        reportSubject: reportSubject || undefined,
        otherSymptomText: symptoms.includes('Other') ? otherSym || undefined : undefined,
        sickCount: usesHumanSymptomFlow ? parseInt(sickCount, 10) || 1 : undefined,
        onset: onset || undefined,
        diagnosed: diagnosed === 'Yes' ? true : diagnosed === 'No' ? false : null,
        absentFromWorkSchool: absentFromWorkSchool === 'Yes' ? true : absentFromWorkSchool === 'No' ? false : null,
        animalTypes: usesAnimalFlow ? animalTypes : undefined,
        animalObservations: usesAnimalFlow ? animalObservationIds : undefined,
        animalIncidentDate: usesAnimalFlow ? animalIncidentDate || undefined : undefined,
        animalSpecies: usesAnimalFlow ? animalSpecies || undefined : undefined,
        animalAffectedCount: usesAnimalFlow ? parseInt(animalAffectedCount, 10) || undefined : undefined,
        animalOtherIncidentDetails: usesAnimalFlow && animalObservations.includes('Other') ? animalOtherIncidentDetails || undefined : undefined,
        animalNotes: usesAnimalFlow ? animalNotes || undefined : undefined,
        environmentObservations: usesEnvironmentFlow ? environmentObservationIds : undefined,
        environmentIncidentDate: usesEnvironmentFlow ? environmentIncidentDate || undefined : undefined,
        environmentVectorDensity: usesEnvironmentFlow ? environmentVectorDensity || undefined : undefined,
        environmentNotes: usesEnvironmentFlow ? environmentNotes || undefined : undefined,
      });

      if (reportZip) {
        await setUserZip(reportZip);
      }
    } catch (error) {
      console.log('Failed to save local report:', error);
    }

    if (onReportSubmitted) {
      await onReportSubmitted();
    }
    go(step + 1);
  };

  const reset = () => {
    setFeeling(''); setCats([]); setReportSubject(''); setSymptoms([]); setOtherSym(''); setSickCount('1');
    setZip(''); setOnset(''); setDiagnosed('');
    setAbsentFromWorkSchool(''); setAnimalObservations([]); setEnvironmentObservations([]);
    setAnimalTypes([]); setAnimalIncidentDate(''); setAnimalZip(''); setAnimalSpecies('');
    setAnimalAffectedCount('1'); setAnimalPhoto(null); setAnimalOtherIncidentDetails('');
    setEnvironmentIncidentDate(''); setEnvironmentZip('');
    setEnvironmentVectorDensity('');
    setEnvironmentPhoto(null); setAnimalNotes(''); setEnvironmentNotes('');
    setVoiceText(''); setShowVoiceCapture(null); setListening(false); setAnalyzingSymptoms(false);
    setDatePickerTarget(null);
    setStep(0); fa.setValue(1); sl.setValue(0);
  };

  // ── Can continue? ──
  const canContinue = () => {
    switch (currentStepName) {
      case 'feeling': return feeling !== '';
      case 'category': return feeling === 'good' || cats.length > 0;
      case 'symptoms': return reportSubject !== '' && symptoms.length > 0 && zip.length === 5;
      case 'assessment': return onset !== '';
      case 'animalObservations': return animalIncidentDate.trim() !== '' && animalZip.length === 5 && animalSpecies.trim() !== '' && (parseInt(animalAffectedCount, 10) || 0) > 0;
      case 'environmentObservations': return environmentObservations.length > 0 && environmentIncidentDate.trim() !== '' && environmentZip.length === 5;
      default: return false;
    }
  };

  const isLastBeforeDone = steps[step + 1] === 'done';

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastBeforeDone) { void submit(); } else { go(step + 1); }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onClose) {
      void onClose();
    } else if (onReturnHome) {
      void onReturnHome();
    } else {
      reset();
    }
  };

  const handleFeelingSelect = (nextFeeling: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeeling(nextFeeling);
    setCats((prev) => {
      if (nextFeeling === 'sick') {
        return prev.includes('people') ? prev : [...prev, 'people'];
      }
      if (nextFeeling === 'good') {
        return prev.filter((cat) => cat !== 'people');
      }
      return prev;
    });
    if (stepRef.current === 0) {
      setTimeout(() => go(1), 120);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    if (feeling === 'sick' && categoryId === 'people' && cats.includes('people')) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextCats = cats.includes(categoryId)
      ? cats.filter((cat) => cat !== categoryId)
      : [...cats, categoryId];

    setCats(nextCats);

    if (!nextCats.includes('animals')) {
      setAnimalObservations([]);
      setAnimalTypes([]);
      setAnimalIncidentDate('');
      setAnimalZip('');
      setAnimalSpecies('');
      setAnimalAffectedCount('1');
      setAnimalPhoto(null);
      setAnimalOtherIncidentDetails('');
      setAnimalNotes('');
    }
    if (!nextCats.includes('environment')) {
      setEnvironmentObservations([]);
      setEnvironmentIncidentDate('');
      setEnvironmentZip('');
      setEnvironmentVectorDensity('');
      setEnvironmentPhoto(null);
      setEnvironmentNotes('');
    }
  };

  const changeSickCount = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSickCount((prev) => {
      const current = parseInt(prev, 10) || 1;
      return String(Math.min(999, Math.max(1, current + delta)));
    });
  };

  const changeAnimalAffectedCount = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnimalAffectedCount((prev) => {
      const current = parseInt(prev, 10) || 1;
      return String(Math.min(999, Math.max(1, current + delta)));
    });
  };

  const openDatePicker = (target: DatePickerTarget, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const parsed = parseCalendarDate(value) || new Date();
    setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setDatePickerTarget(target);
  };

  const selectCalendarDate = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const formatted = formatCalendarDate(date);
    if (datePickerTarget === 'animal') setAnimalIncidentDate(formatted);
    if (datePickerTarget === 'environment') setEnvironmentIncidentDate(formatted);
    setDatePickerTarget(null);
  };

  const moveCalendarMonth = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const applyVoiceText = useCallback((text: string, target: VoiceTarget) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setAnalyzingSymptoms(true);
    setTimeout(() => {
      const normalized = cleanText.toLowerCase();
      const guessedDate = inferIncidentDate(cleanText);
      const guessedNumber = inferFirstNumber(cleanText);

      if (target === 'symptoms') {
        const matches = SYMPTOM_RULES
          .filter(({ terms }) => terms.some((term) => normalized.includes(term)))
          .map(({ id }) => id);

        if (matches.length > 0) {
          setSymptoms((prev) => [...prev, ...matches.filter((id) => !prev.includes(id))]);
        } else {
          setSymptoms((prev) => prev.includes('Other') ? prev : [...prev, 'Other']);
          setOtherSym(cleanText);
        }
      }

      if (target === 'animals') {
        const matchedTypes = ANIMAL_TYPES
          .filter(({ terms }) => terms.some((term) => normalized.includes(term)))
          .map(({ id }) => id);
        const guessedSpecies = inferSpecies(cleanText);

        if (matchedTypes.length > 0) {
          setAnimalTypes((prev) => [...prev, ...matchedTypes.filter((id) => !prev.includes(id))]);
        }
        if (guessedDate) setAnimalIncidentDate((prev) => prev || guessedDate);
        if (guessedNumber) setAnimalAffectedCount(guessedNumber);
        if (guessedSpecies) setAnimalSpecies((prev) => prev.trim() ? prev : guessedSpecies);
        const incidentMatches: string[] = [];
        if (normalized.includes('sudden') || normalized.includes('suddenly') || normalized.includes('sick') || normalized.includes('ill')) incidentMatches.push('Sudden sickness');
        if (normalized.includes('dead') || normalized.includes('found dead') || normalized.includes('died')) incidentMatches.push('Found dead');
        if (normalized.includes('strange') || normalized.includes('weird') || normalized.includes('unusual behavior') || normalized.includes('acting unusual') || normalized.includes('staggering')) {
          incidentMatches.push('Unusual behavior');
        }
        if (incidentMatches.length > 0) {
          setAnimalObservations((prev) => [...prev, ...incidentMatches.filter((id) => !prev.includes(id))]);
        } else {
          setAnimalObservations((prev) => prev.includes('Other') ? prev : [...prev, 'Other']);
          setAnimalOtherIncidentDetails((prev) => prev.trim() ? prev : cleanText);
        }
        setAnimalNotes((prev) => appendReportNote(prev, cleanText));
      }

      if (target === 'environment') {
        if (guessedDate) setEnvironmentIncidentDate((prev) => prev || guessedDate);
        if (guessedNumber) setEnvironmentVectorDensity((prev) => prev || guessedNumber);
        const environmentMatches: string[] = [];
        if (normalized.includes('mosquito') || normalized.includes('tick') || normalized.includes('flea') || normalized.includes('vector')) {
          environmentMatches.push('Vector spotting');
        }
        if (normalized.includes('flood') || normalized.includes('standing water')) {
          environmentMatches.push('Water flooding');
        }
        if (normalized.includes('contamination') || normalized.includes('contaminated') || normalized.includes('sewage') || normalized.includes('dirty water')) {
          environmentMatches.push('Water contamination');
        }
        if (environmentMatches.length > 0) {
          setEnvironmentObservations((prev) => [...prev, ...environmentMatches.filter((id) => !prev.includes(id))]);
        } else {
          setEnvironmentObservations((prev) => prev.includes('Other') ? prev : [...prev, 'Other']);
        }
        setEnvironmentNotes((prev) => appendReportNote(prev, cleanText));
      }

      setAnalyzingSymptoms(false);
      setShowVoiceCapture(null);
    }, 650);
  }, []);

  const startVoiceListening = (target: VoiceTarget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    holdingVoiceRef.current = true;
    activeVoiceTargetRef.current = target;

    if (listening) return;

    if (Platform.OS !== 'web') {
      holdingVoiceRef.current = false;
      Alert.alert('Voice input', 'Voice capture is available in the web app for now.');
      return;
    }

    const SpeechRecognition =
      (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      holdingVoiceRef.current = false;
      Alert.alert('Voice input', 'This browser does not support speech recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    let latestText = '';

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += `${event.results[i][0].transcript} `;
      }
      latestText = transcript.trim();
      voiceTextRef.current = latestText;
      setVoiceText(latestText);
    };

    recognition.onerror = () => {
      holdingVoiceRef.current = false;
      setListening(false);
      setAnalyzingSymptoms(false);
      speechRecognitionRef.current = null;
    };

    recognition.onend = () => {
      if (holdingVoiceRef.current) {
        try {
          recognition.start();
          return;
        } catch {}
      }

      setListening(false);
      speechRecognitionRef.current = null;
      const capturedText = latestText || voiceTextRef.current;
      if (capturedText) applyVoiceText(capturedText, activeVoiceTargetRef.current);
    };

    speechRecognitionRef.current = recognition;
    voiceTextRef.current = '';
    setVoiceText('');
    setAnalyzingSymptoms(false);
    setListening(true);
    recognition.start();
  };

  const stopVoiceListening = () => {
    holdingVoiceRef.current = false;
    speechRecognitionRef.current?.stop();
  };

  const Chip = ({ label, icon, on, onP }: { label: string; icon?: keyof typeof Ionicons.glyphMap; on: boolean; onP: () => void }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onP} style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: compactPhone ? 8 : 10, paddingHorizontal: 14, borderRadius: 100, marginRight: 8, marginBottom: 8,
      backgroundColor: on ? t.selBg : t.fill,
      borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
      maxWidth: '100%',
    }}>
      {icon && <Ionicons name={icon} size={15} color={on ? t.text : t.sub} />}
      <Text style={{ color: on ? t.text : t.sub, fontSize: 14, lineHeight: 18, flexShrink: 1, fontFamily: on ? 'Manrope_600SemiBold' : 'Manrope_500Medium' }}>{label}</Text>
    </TouchableOpacity>
  );

  const Heading = ({ children }: { children: string }) => (
    <Text style={{ color: t.text, fontSize: compactPhone ? 26 : 28, fontFamily: 'Manrope_700Bold', letterSpacing: 0, lineHeight: compactPhone ? 31 : 34, marginBottom: 6 }}>{children}</Text>
  );

  const Sub = ({ children }: { children: string }) => (
    <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 14, lineHeight: 19, marginBottom: compactPhone ? 14 : 20 }}>{children}</Text>
  );

  const Label = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: fieldGapTop, marginBottom: 8 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 11, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2 }}>{children}</Text>
    </View>
  );

  // ── Screens ──
  const renderLocationInput = (value: string, onChange: (value: string) => void) => (
    <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
      <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: compactPhone ? 12 : 14 }}
        placeholder={loc.zip} placeholderTextColor={t.hint}
        value={value} onChangeText={v => onChange(v.replace(/\D/g, '').slice(0, 5))}
        keyboardType="number-pad" maxLength={5} />
      <TouchableOpacity onPress={() => getZip(onChange)}>
        <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{locL ? '...' : loc.detect}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDateInput = (value: string, target: DatePickerTarget) => (
    <TouchableOpacity activeOpacity={0.74} onPress={() => openDatePicker(target, value)}
      style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="calendar-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
      <Text style={{
        flex: 1, color: value ? t.text : t.hint, fontSize: 16,
        fontFamily: 'Manrope_600SemiBold', paddingVertical: compactPhone ? 13 : 15,
      }}>
        {value || 'Select date'}
      </Text>
      <Ionicons name="chevron-down" size={16} color={t.hint} />
    </TouchableOpacity>
  );

  const renderPhotoButton = (photo: string | null, setPhoto: (value: string | null) => void) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => takePhoto(setPhoto)}
      style={{
        backgroundColor: t.card, borderRadius: 12, paddingVertical: compactPhone ? 14 : 16, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: photo ? t.accentMid : t.line,
      }}>
      <Ionicons name={photo ? 'checkmark-circle' : 'camera-outline'} size={18} color={photo ? t.green : t.hint} />
      <Text style={{ color: photo ? t.green : t.sub, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>
        {photo ? loc.photo_added : 'Take optional photo'}
      </Text>
    </TouchableOpacity>
  );

  const renderCalendarModal = () => {
    const selectedDate = parseCalendarDate(datePickerTarget === 'animal' ? animalIncidentDate : environmentIncidentDate);
    const today = new Date();
    const days = getCalendarDays(calendarMonth);

    return (
      <Modal visible={datePickerTarget !== null} transparent animationType="fade" onRequestClose={() => setDatePickerTarget(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setDatePickerTarget(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' }}
          />
          <View style={{
            backgroundColor: t.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: pageX,
            paddingTop: 18,
            paddingBottom: compactPhone ? 28 : 22,
            borderWidth: 1,
            borderColor: t.line,
          }}>
            <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: t.line, alignSelf: 'center', marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ color: t.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold' }}>
                  Date of incident
                </Text>
                <Text style={{ color: t.sub, fontSize: 12, fontFamily: 'Manrope_500Medium', marginTop: 2 }}>
                  {datePickerTarget === 'animal' ? 'Animal report' : 'Environment report'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDatePickerTarget(null)}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={18} color={t.text} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: t.card, borderRadius: 16, padding: 12, borderWidth: 1.5, borderColor: t.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => moveCalendarMonth(-1)}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-back" size={18} color={t.sub} />
                </TouchableOpacity>
                <Text style={{ color: t.text, fontSize: 16, fontFamily: 'Manrope_800ExtraBold' }}>
                  {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => moveCalendarMonth(1)}
                  style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="chevron-forward" size={18} color={t.sub} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                {WEEK_DAYS.map((day, index) => (
                  <Text key={`${day}-${index}`} style={{
                    width: `${100 / 7}%`,
                    textAlign: 'center',
                    color: t.hint,
                    fontSize: 11,
                    fontFamily: 'Manrope_700Bold',
                  }}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {days.map((day, index) => {
                  const selected = sameCalendarDay(day, selectedDate);
                  const current = sameCalendarDay(day, today);
                  return (
                    <View key={day ? day.toISOString() : `blank-${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                      {day && (
                        <TouchableOpacity
                          activeOpacity={0.72}
                          onPress={() => selectCalendarDate(day)}
                          style={{
                            flex: 1,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected ? t.accent : current ? t.accentSoft : 'transparent',
                            borderWidth: current && !selected ? 1.4 : 0,
                            borderColor: current && !selected ? t.accentMid : 'transparent',
                          }}>
                          <Text style={{
                            color: selected ? t.inv : t.text,
                            fontSize: 14,
                            fontFamily: selected || current ? 'Manrope_800ExtraBold' : 'Manrope_600SemiBold',
                          }}>
                            {day.getDate()}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={() => {
                  if (datePickerTarget === 'animal') setAnimalIncidentDate('');
                  if (datePickerTarget === 'environment') setEnvironmentIncidentDate('');
                  setDatePickerTarget(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: t.fill,
                  alignItems: 'center',
                }}>
                <Text style={{ color: t.sub, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={() => selectCalendarDate(today)}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: t.accent,
                  alignItems: 'center',
                }}>
                <Text style={{ color: t.inv, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>Today</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderVoiceHelper = (target: VoiceTarget, title: string, subtitle: string) => {
    const expanded = showVoiceCapture === target;
    return (
      <View style={{ marginTop: compactPhone ? 12 : 14, marginBottom: 2 }}>
        {!expanded ? (
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setVoiceText('');
              setShowVoiceCapture(target);
            }}
            style={{
              backgroundColor: t.card,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: t.line,
              paddingVertical: compactPhone ? 12 : 14,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View style={{
              width: 36, height: 36, borderRadius: 11,
              backgroundColor: t.accentSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="mic-outline" size={18} color={t.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
              <Text style={{ color: t.sub, fontSize: 12, lineHeight: 17, fontFamily: 'Manrope_400Regular', marginTop: 2 }}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-down-outline" size={16} color={t.hint} />
          </TouchableOpacity>
        ) : (
          <View style={{
            backgroundColor: t.card,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: listening || analyzingSymptoms ? t.accent : t.line,
            padding: compactPhone ? 14 : 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>
                  AI report helper
                </Text>
                <Text style={{ color: t.sub, fontSize: 12, lineHeight: 17, fontFamily: 'Manrope_400Regular', marginTop: 2 }}>
                  Hold while speaking, release to analyze.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  stopVoiceListening();
                  setShowVoiceCapture(null);
                }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={16} color={t.sub} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={() => startVoiceListening(target)}
                onPressOut={stopVoiceListening}
                style={{
                  width: compactPhone ? 96 : 108, height: compactPhone ? 96 : 108, borderRadius: compactPhone ? 48 : 54,
                  backgroundColor: listening ? t.accent : t.accentSoft,
                  borderWidth: 2,
                  borderColor: listening || analyzingSymptoms ? t.accent : t.accentMid,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name={listening ? 'radio-button-on-outline' : analyzingSymptoms ? 'sparkles-outline' : 'mic-outline'}
                  size={26}
                  color={listening ? t.inv : t.accent}
                />
                <Text style={{
                  color: listening ? t.inv : t.accent,
                  fontSize: 12,
                  fontFamily: 'Manrope_800ExtraBold',
                  marginTop: 8,
                }}>
                  {listening ? 'Listening' : analyzingSymptoms ? 'Analyzing' : 'Hold'}
                </Text>
              </TouchableOpacity>

              <Text style={{
                color: voiceText ? t.text : t.hint,
                fontSize: 12,
                lineHeight: 18,
                textAlign: 'center',
                fontFamily: voiceText ? 'Manrope_500Medium' : 'Manrope_400Regular',
                marginTop: 12,
                minHeight: 36,
              }}>
                {voiceText || (analyzingSymptoms ? 'AI is checking this report...' : 'Your words will appear here.')}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderObservationScreen = (kind: 'animals' | 'environment') => {
    if (kind === 'animals') {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}
          keyboardShouldPersistTaps="handled">
          <Heading>Animal report</Heading>
          <Sub>Tell us what happened and which animals were affected.</Sub>

          {renderVoiceHelper('animals', 'Describe the animal report', 'Hold to talk and AI will fill matching details.')}

          <Label icon="paw-outline">Animal type</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 8 }}>
            {ANIMAL_TYPES.map((type, index) => {
              const on = animalTypes.includes(type.id);
              return (
                <TouchableOpacity
                  key={type.id}
                  activeOpacity={0.74}
                  onPress={() => togArr(animalTypes, setAnimalTypes, type.id)}
                  style={{
                    alignItems: 'center',
                    width: '31%',
                    height: compactPhone ? 102 : 110,
                    marginRight: (index + 1) % 3 === 0 ? 0 : '3.5%',
                    backgroundColor: on ? t.accentSoft : t.card,
                    borderRadius: 14,
                    paddingVertical: compactPhone ? 8 : 10,
                    paddingHorizontal: 5,
                    borderWidth: on ? 2 : 1.5,
                    borderColor: on ? t.accent : t.line,
                  }}>
                  <Image source={type.badge} resizeMode="contain" style={{
                    width: compactPhone ? 56 : 60,
                    height: compactPhone ? 56 : 60,
                  }} />
                  <Text numberOfLines={2} style={{
                    color: on ? t.text : t.sub,
                    fontSize: 11,
                    lineHeight: 13,
                    marginTop: 5,
                    textAlign: 'center',
                    fontFamily: on ? 'Manrope_700Bold' : 'Manrope_600SemiBold',
                  }}>
                    {type.id}
                  </Text>
                  <View style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.6,
                    borderColor: on ? t.accent : t.line,
                    backgroundColor: on ? t.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {on && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label icon="alert-circle-outline">Incident details</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {animalObservationOptions.map(o => (
              <Chip key={o.id} label={(loc.obs as any)[o.id] || o.id} icon={o.icon} on={animalObservations.includes(o.id)} onP={() => toggleAnimalObservation(o.id)} />
            ))}
          </View>

          {animalObservations.includes('Other') && (
            <TextInput style={{
              backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15,
              paddingHorizontal: 16, paddingVertical: 12, minHeight: compactPhone ? 58 : 66,
              textAlignVertical: 'top', fontFamily: 'Manrope_500Medium',
              borderWidth: 1.5, borderColor: t.line,
            }} placeholder="Add more details about the incident..." placeholderTextColor={t.hint}
              value={animalOtherIncidentDetails} onChangeText={setAnimalOtherIncidentDetails} multiline />
          )}

          <Label icon="leaf-outline">Species</Label>
          <TextInput style={{
            backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 16,
            paddingHorizontal: 16, paddingVertical: compactPhone ? 12 : 14, fontFamily: 'Manrope_600SemiBold',
          }} placeholder="Example: dog, chicken, bat" placeholderTextColor={t.hint}
            value={animalSpecies} onChangeText={setAnimalSpecies} />

          <Label icon="calculator-outline">Number of affected animals</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => changeAnimalAffectedCount(-1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center',
              }}>
              <Ionicons name="remove-outline" size={18} color={t.sub} />
            </TouchableOpacity>
            <TextInput style={{ flex: 1, color: t.text, fontSize: 18, fontFamily: 'Manrope_700Bold', paddingVertical: compactPhone ? 12 : 14, textAlign: 'center' }}
              value={animalAffectedCount} onChangeText={v => setAnimalAffectedCount(v.replace(/\D/g, '').slice(0, 3) || '1')}
              keyboardType="number-pad" maxLength={3} />
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => changeAnimalAffectedCount(1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: t.accentMid,
              }}>
              <Ionicons name="add-outline" size={18} color={t.accent} />
            </TouchableOpacity>
          </View>

          <Label icon="calendar-outline">Date of incident</Label>
          {renderDateInput(animalIncidentDate, 'animal')}

          <Label icon="location-outline">Location</Label>
          {renderLocationInput(animalZip, setAnimalZip)}

          <Label icon="camera-outline">{loc.photo_h}</Label>
          {renderPhotoButton(animalPhoto, setAnimalPhoto)}

          <Label icon="document-text-outline">{loc.notes}</Label>
          <TextInput style={{
            backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15,
            paddingHorizontal: 16, paddingVertical: 12, minHeight: compactPhone ? 64 : 78, textAlignVertical: 'top',
          }} placeholder="Describe the animal incident..." placeholderTextColor={t.hint}
            value={animalNotes} onChangeText={setAnimalNotes} multiline />
        </ScrollView>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}
        keyboardShouldPersistTaps="handled">
        <Heading>Environment report</Heading>
        <Sub>Report environmental conditions that may affect community health.</Sub>

        <Label icon="leaf-outline">Environmental incident</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {environmentObservationOptions.map(o => (
            <Chip key={o.id} label={(loc.obs as any)[o.id] || o.id} icon={o.icon} on={environmentObservations.includes(o.id)} onP={() => togArr(environmentObservations, setEnvironmentObservations, o.id)} />
          ))}
        </View>

        <Label icon="calendar-outline">Date of incident</Label>
        {renderDateInput(environmentIncidentDate, 'environment')}

        <Label icon="stats-chart-outline">Vector count</Label>
        <TextInput style={{
          backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 16,
          paddingHorizontal: 16, paddingVertical: compactPhone ? 12 : 14, fontFamily: 'Manrope_600SemiBold',
        }} placeholder="Example: 12 mosquitoes" placeholderTextColor={t.hint}
          value={environmentVectorDensity} onChangeText={v => setEnvironmentVectorDensity(v.replace(/\D/g, '').slice(0, 5))}
          keyboardType="number-pad" maxLength={5} />

        <Label icon="location-outline">Location</Label>
        {renderLocationInput(environmentZip, setEnvironmentZip)}

        <Label icon="camera-outline">{loc.photo_h}</Label>
        {renderPhotoButton(environmentPhoto, setEnvironmentPhoto)}

        <Label icon="document-text-outline">{loc.notes}</Label>
        <TextInput style={{
          backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15,
          paddingHorizontal: 16, paddingVertical: 12, minHeight: compactPhone ? 64 : 78, textAlignVertical: 'top',
        }} placeholder={loc.any_det} placeholderTextColor={t.hint}
          value={environmentNotes} onChangeText={setEnvironmentNotes} multiline />
        {renderVoiceHelper('environment', 'Describe the environment report', 'Hold to talk and AI will fill matching details.')}
      </ScrollView>
    );
  };

  const screen = () => {
    switch (currentStepName) {

      // ── Feeling + Category (combined) ──
      case 'feeling': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}>
          <Text style={{ color: t.text, fontSize: 29, fontFamily: 'Manrope_700Bold', letterSpacing: 0, lineHeight: 34, marginBottom: 6 }}>
            {loc.feeling_h}
          </Text>
          <Sub>{loc.feeling_s}</Sub>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { id: 'sick', label: loc.sick, emoji: '🤒' },
              { id: 'good', label: loc.good, emoji: '😊' },
            ].map(({ id, label, emoji }) => {
              const on = feeling === id;
              const tone = id === 'sick'
                ? {
                  accent: mode === 'dark' ? '#F1B437' : '#A66F00',
                  soft: mode === 'dark' ? '#17140C' : '#FFFDF6',
                  mid: mode === 'dark' ? '#40310B' : '#FFE9A8',
                  frame: mode === 'dark' ? '#2C2513' : '#EFE4BC',
                }
                : {
                  accent: t.accent,
                  soft: mode === 'dark' ? '#101A12' : '#F7FCF7',
                  mid: t.accentMid,
                  frame: mode === 'dark' ? '#213B25' : '#D7E8D7',
                };
              return (
                <TouchableOpacity key={id} activeOpacity={0.7}
                  onPress={() => handleFeelingSelect(id)}
                  style={{
                    flex: 1, alignItems: 'center', gap: 10,
                    backgroundColor: on ? tone.mid : tone.soft, borderRadius: 16,
                    paddingVertical: 20, paddingHorizontal: 12,
                    borderWidth: on ? 2 : 1.5, borderColor: on ? tone.accent : tone.frame,
                  }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 16,
                    backgroundColor: on ? tone.soft : t.card,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 33, lineHeight: 37 }}>{emoji}</Text>
                  </View>
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 15, lineHeight: 19, textAlign: 'center', fontFamily: 'Manrope_600SemiBold' }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </ScrollView>
      );

      case 'category': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}>
          <Heading>{loc.cat_h}</Heading>
          <Sub>{loc.cat_s}</Sub>

          {[
            { id: 'people', title: loc.people, desc: loc.people_d, icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'animals', title: loc.animals, desc: loc.animals_d, icon: 'paw-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'environment', title: loc.env, desc: loc.env_d, icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
          ].map(({ id, title, desc, icon }) => {
            const on = cats.includes(id);
            const locked = feeling === 'sick' && id === 'people' && on;
            return (
              <TouchableOpacity key={id} activeOpacity={0.7}
                onPress={() => handleCategorySelect(id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: on ? t.selBg : t.card, borderRadius: 14,
                  paddingVertical: compactPhone ? 13 : 16, paddingHorizontal: 16, marginBottom: 8,
                  borderWidth: 1.5, borderColor: on ? t.sub : t.line,
                }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: t.fill,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={icon} size={18} color={on ? t.text : t.sub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontFamily: 'Manrope_600SemiBold' }}>{title}</Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 12, marginTop: 2 }}>{desc}</Text>
                </View>
                <View style={{
                  width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
                  borderColor: on ? t.sub : t.hint,
                  backgroundColor: on ? t.sub : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {locked ? (
                    <Ionicons name="lock-closed" size={12} color={t.inv} />
                  ) : (
                    on && <Ionicons name="checkmark" size={13} color={t.inv} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );

      // ── Sick: Symptoms + Location ──
      case 'symptoms': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}
          keyboardShouldPersistTaps="handled">
          <Heading>{loc.sym_h}</Heading>
          <Sub>{loc.cat_s}</Sub>

          <Label icon="person-circle-outline">{loc.report_about}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: compactPhone ? 8 : 10 }}>
            {[
              { id: 'self', label: loc.report_self, icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
              { id: 'someone_else', label: loc.report_someone_else, icon: 'people-outline' as keyof typeof Ionicons.glyphMap },
            ].map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                icon={option.icon}
                on={reportSubject === option.id}
                onP={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setReportSubject(option.id);
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 8 }}>
            {SYMPTOMS.map((s, index) => {
              const on = symptoms.includes(s.id);
              const label = (loc.sym as any)[s.id] || s.id;
              const isOther = s.id === 'Other';
              return (
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.74}
                  onPress={() => togArr(symptoms, setSymptoms, s.id)}
                  style={{
                    alignItems: 'center',
                    width: '23%',
                    height: compactPhone ? 98 : 106,
                    marginRight: (index + 1) % 4 === 0 ? 0 : '2.66%',
                    backgroundColor: on ? `${s.color}${mode === 'dark' ? '26' : '14'}` : t.card,
                    borderRadius: 14,
                    paddingVertical: compactPhone ? 7 : 8,
                    paddingHorizontal: 4,
                    borderWidth: on ? 2 : 1.5,
                    borderColor: on ? s.color : t.line,
                  }}>
                  <View style={{
                    width: compactPhone ? 50 : 54,
                    height: compactPhone ? 50 : 54,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isOther ? (
                      <View style={{
                        width: compactPhone ? 46 : 50,
                        height: compactPhone ? 46 : 50,
                        borderRadius: 15,
                        backgroundColor: s.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name="add-circle-outline" size={compactPhone ? 28 : 30} color="#FFFFFF" />
                      </View>
                    ) : (
                      <Image source={s.badge} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
                    )}
                  </View>
                  <Text numberOfLines={3} style={{
                    color: on ? t.text : t.sub,
                    fontSize: 9,
                    lineHeight: 10.5,
                    height: 32,
                    marginTop: 5,
                    textAlign: 'center',
                    fontFamily: on ? 'Manrope_700Bold' : 'Manrope_500Medium',
                  }}>
                    {label}
                  </Text>
                  <View style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.6,
                    borderColor: on ? s.color : t.line,
                    backgroundColor: on ? s.color : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {on && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {symptoms.includes('Other') && (
            <TextInput style={{
              color: t.text,
              fontSize: 15,
              borderBottomWidth: 1,
              borderColor: t.line,
              paddingVertical: 10,
              marginTop: 4,
              marginBottom: 16,
              fontFamily: 'Manrope_500Medium',
            }} placeholder={loc.desc_sym} placeholderTextColor={t.hint}
              value={otherSym} onChangeText={setOtherSym} />
          )}

          {renderVoiceHelper('symptoms', 'Describe symptoms instead', 'Use hold-to-talk and AI will check matching options.')}

          <Label icon="people-outline">{loc.how_many}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="person-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => changeSickCount(-1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center',
              }}>
              <Ionicons name="remove-outline" size={18} color={t.sub} />
            </TouchableOpacity>
            <TextInput style={{ flex: 1, color: t.text, fontSize: 18, fontFamily: 'Manrope_700Bold', paddingVertical: compactPhone ? 12 : 14, textAlign: 'center' }}
              value={sickCount} onChangeText={v => setSickCount(v.replace(/\D/g, '').slice(0, 3) || '1')}
              keyboardType="number-pad" maxLength={3} />
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => changeSickCount(1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: t.accentMid,
              }}>
              <Ionicons name="add-outline" size={18} color={t.accent} />
            </TouchableOpacity>
          </View>

          <Label icon="location-outline">{loc.where}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: compactPhone ? 12 : 14 }}
              placeholder={loc.zip} placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={() => getZip(setZip)}>
              <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{locL ? '…' : loc.detect}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      );

      // ── Sick: Assessment ──
      case 'assessment': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}>
          <Heading>{loc.more_h}</Heading>
          <Sub>{loc.more_s}</Sub>

          <Label icon="calendar-outline">{loc.when_start}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ONSET.map(o => <Chip key={o} label={(loc.ons as any)[o] || o} on={onset === o} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOnset(o); }} />)}
          </View>

          <Label icon="school-outline">{loc.absent_work_school}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Yes', 'No'].map(a => (
              <Chip
                key={a}
                label={a === 'Yes' ? loc.yes : loc.no}
                on={absentFromWorkSchool === a}
                onP={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAbsentFromWorkSchool(a);
                }}
              />
            ))}
          </View>

          <Label icon="medkit-outline">{loc.prof_diag}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Yes', 'No'].map(d => {
              const dl = d === 'Yes' ? loc.yes : loc.no;
              return (
                <Chip
                  key={d}
                  label={dl}
                  on={diagnosed === d}
                  onP={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDiagnosed(d);
                  }}
                />
              );
            })}
          </View>
        </ScrollView>
      );

      // ── Good: Observations ──
      case 'animalObservations': return renderObservationScreen('animals');
      case 'environmentObservations': return renderObservationScreen('environment');
      case 'observations': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pageX, paddingBottom: scrollBottom }}
          keyboardShouldPersistTaps="handled">
          <Heading>{observationHeading}</Heading>
          <Sub>{observationSub}</Sub>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {visibleObservations.map(o => (
              <Chip key={o.id} label={(loc.obs as any)[o.id] || o.id} icon={o.icon} on={observations.includes(o.id)} onP={() => togArr(observations, setObservations, o.id)} />
            ))}
          </View>

          <Label icon="location-outline">{loc.loc}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: compactPhone ? 12 : 14 }}
              placeholder={loc.zip} placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={() => getZip(setZip)}>
              <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{locL ? '…' : loc.detect}</Text>
            </TouchableOpacity>
          </View>

          <Label icon="document-text-outline">{loc.notes}</Label>
          <TextInput style={{
            backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15,
            paddingHorizontal: 16, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top',
          }} placeholder={loc.any_det} placeholderTextColor={t.hint}
            value={goodNotes} onChangeText={setGoodNotes} multiline />
        </ScrollView>
      );

      // ── Done ──
      case 'done': return <Done t={t} mode={mode} reset={reset} onSignUp={onSignUp} onReturnHome={onReturnHome || onSubmitComplete} loc={loc} />;
      default: return null;
    }
  };

  const isDone = currentStepName === 'done';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={formShellStyle}>
        <StatusBar style={t.bar} />
        {!isDone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: pageX, paddingTop: headerTop, paddingBottom: headerBottom }}>
            <View style={{ width: 50 }}>
              {step > 0 && (
                <TouchableOpacity onPress={() => go(step - 1)}>
                  <Text style={{ color: t.sub, fontSize: 15, fontFamily: 'Manrope_500Medium' }}>{loc.back}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {visibleSteps.map((_, i) => (
                <View key={i} style={{ width: i === step ? 16 : 4, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.accent : t.line }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: 96, justifyContent: 'flex-end', gap: 10 }}>
              <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.hint, fontSize: 13 }}>{currentVisibleStep}/{totalSteps}</Text>
              <TouchableOpacity onPress={toggleSettings} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="settings-outline" size={20} color={t.sub} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close survey"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: t.fill, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={17} color={t.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Animated.View style={{ flex: 1, opacity: fa, transform: [{ translateY: sl }] }}>
          {screen()}
        </Animated.View>
        {!isDone && (
          <View style={{ paddingHorizontal: pageX, paddingTop: footerTop, paddingBottom: footerBottom }}>
            <TouchableOpacity activeOpacity={0.8} disabled={!canContinue()}
              onPress={handleNext}
              style={{
                backgroundColor: canContinue() ? t.accent : t.fill,
                borderRadius: 14, paddingVertical: compactPhone ? 13 : 15, minHeight: 52,
                alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: compactPhone ? 366 : 386,
                alignSelf: 'center',
              }}>
              <Text style={{ color: canContinue() ? t.inv : t.hint, fontSize: 16, fontFamily: 'Manrope_600SemiBold' }}>
                {skipsDetailsForGood ? loc.continue : isLastBeforeDone ? loc.submit : loc.continue}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {renderCalendarModal()}

        {/* Settings / Language Overlay */}
        {showSettings && (
          <Animated.View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.6)',
            opacity: settingsAnim, justifyContent: 'flex-end'
          }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleSettings} />
            <Animated.View style={{
              backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingHorizontal: pageX, paddingBottom: 50, paddingTop: 32,
              transform: [{
                translateY: settingsAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })
              }]
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ color: t.text, fontSize: 22, fontFamily: 'Manrope_700Bold', letterSpacing: -0.5 }}>{loc.lang_theme}</Text>
                <TouchableOpacity onPress={toggleSettings} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ backgroundColor: t.fill, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={18} color={t.text} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: t.sub, fontSize: 12, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>{loc.sel_lang}</Text>
              <View style={{ gap: 8, marginBottom: 32 }}>
                {[
                  { id: 'EN', name: 'English', native: 'English' },
                  { id: 'ES', name: 'Spanish', native: 'Español' },
                  { id: 'TO', name: "Tohono O'odham", native: "O'odham ñiok" },
                ].map((l) => {
                  const on = lang === l.id;
                  return (
                    <TouchableOpacity key={l.id} activeOpacity={0.7}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLangState(l.id as any); setStorageLang(l.id); setTimeout(toggleSettings, 300); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: on ? t.selBg : t.fill, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
                        borderWidth: 1.5, borderColor: on ? t.text : 'transparent'
                      }}>
                      <View>
                        <Text style={{ color: t.text, fontSize: 16, fontFamily: on ? 'Manrope_600SemiBold' : 'Manrope_500Medium' }}>{l.native}</Text>
                        <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 12, marginTop: 2 }}>{l.name}</Text>
                      </View>
                      {on && <Ionicons name="checkmark-circle" size={22} color={t.text} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ color: t.sub, fontSize: 12, fontFamily: 'Manrope_600SemiBold', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>{loc.appearance}</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[
                  { id: 'light', name: loc.light, icon: 'sunny-outline' },
                  { id: 'dark', name: loc.dark, icon: 'moon-outline' }
                ].map((m) => {
                  const on = mode === m.id;
                  return (
                    <TouchableOpacity key={m.id} activeOpacity={0.7}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(m.id as any); }}
                      style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                        backgroundColor: on ? t.selBg : t.fill, borderRadius: 14, paddingVertical: 14,
                        borderWidth: 1.5, borderColor: on ? t.text : 'transparent'
                      }}>
                      <Ionicons name={m.icon as any} size={18} color={on ? t.text : t.sub} />
                      <Text style={{ color: on ? t.text : t.sub, fontSize: 15, fontFamily: on ? 'Manrope_600SemiBold' : 'Manrope_500Medium' }}>{m.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Confirmation ────────────────────────────────────────────
function Done({ t, mode, reset, onSignUp, onReturnHome, loc }: { t: Th; mode: string; reset: () => void; onSignUp?: () => void | Promise<void>; onReturnHome?: () => void | Promise<void>; loc: any }) {
  const sc = useRef(new Animated.Value(0)).current;
  const fd = useRef(new Animated.Value(0)).current;
  const thankYouBody = loc.thanks_body || 'Thank you for helping your community stay healthy.';
  const homeLabel = loc.home || 'Back to Home';
  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onReturnHome) {
      void onReturnHome();
    } else {
      reset();
    }
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(sc, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(fd, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 }}>
      <Animated.View style={{
        width: 56, height: 56, borderRadius: 28, backgroundColor: t.green,
        alignItems: 'center', justifyContent: 'center', marginBottom: 24, transform: [{ scale: sc }],
      }}>
        <Ionicons name="checkmark" size={28} color="#fff" />
      </Animated.View>
      <Animated.View style={{ opacity: fd, alignItems: 'center', width: '100%' }}>
        <Text style={{ color: t.text, fontSize: 26, fontFamily: 'Manrope_700Bold', marginBottom: 8, textAlign: 'center' }}>{loc.thanks}</Text>
        <Text style={{ color: t.sub, fontSize: 15, fontFamily: 'Manrope_400Regular', lineHeight: 22, textAlign: 'center', marginBottom: 30 }}>
          {thankYouBody}
        </Text>
        <TouchableOpacity activeOpacity={0.8}
          onPress={goHome}
          style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="home-outline" size={16} color={t.inv} />
          <Text style={{ color: t.inv, fontSize: 15, fontFamily: 'Manrope_600SemiBold' }}>{homeLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reset(); }}
          style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="create-outline" size={16} color={t.text} />
          <Text style={{ color: t.text, fontSize: 15, fontFamily: 'Manrope_500Medium' }}>{loc.rep_anon}</Text>
        </TouchableOpacity>
        {onSignUp && (
          <TouchableOpacity activeOpacity={0.8}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSignUp(); }}
            style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="person-add-outline" size={16} color={t.text} />
            <Text style={{ color: t.text, fontSize: 15, fontFamily: 'Manrope_500Medium' }}>{loc.signup}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}
