import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Animated, KeyboardAvoidingView, Platform,
  ScrollView, Alert, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getLang } from '@/utils/storage';

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

const SYMPTOMS = [
  { id: 'Cough', icon: 'medical-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Fever', icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Very Tired', icon: 'bed-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Nausea', icon: 'water-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Headache', icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Body Aches', icon: 'body-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Sore Throat', icon: 'volume-low-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Other', icon: 'add-outline' as keyof typeof Ionicons.glyphMap },
];
const DIAGNOSES = ['Influenza A', 'Influenza B', 'COVID-19', 'Norovirus', 'Strep Throat', 'RSV', 'Valley Fever', 'Other'];
const ONSET = ['Today', 'Yesterday', 'This week', 'Last week'];
const OBSERVATIONS = [
  { id: 'Dead birds nearby', icon: 'skull-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Sick animals', icon: 'paw-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Unusual mosquito activity', icon: 'bug-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Water issues', icon: 'water-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Air quality concerns', icon: 'cloud-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Nothing unusual', icon: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap }
];

const I18N = {
  EN: {
    back: 'Back',
    feeling_h: 'How are you\nfeeling today?', feeling_s: 'Your report helps Arizona detect health threats early.',
    sick: 'Feeling Sick', sick_d: 'Report symptoms, diagnosis, severity',
    good: 'Feeling Good', good_d: 'Report environmental or animal observations',
    cat_h: 'What is this\nabout?', cat_s: 'Select all that apply.',
    people: 'People', people_d: 'Yourself, family, or friends',
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
    what_diag: 'What were you diagnosed with?', severity: 'Severity',
    mild: 'Mild', mod: 'Moderate', sev: 'Severe',
    obs_h: 'What have you\nobserved?', obs_s: 'Report anything unusual in your environment.',
    loc: 'Your location', notes: 'Notes (optional)', any_det: 'Any additional details…',
    thanks: 'Thank you!', rep_near: 'Reports near you this week', pima: 'across Pima County',
    view_map: 'View Map', rep_anon: 'Report Another', signup: 'Sign Up to Track Reports',
    submit: 'Submit Report', continue: 'Continue',

    sym: { 'Cough':'Cough', 'Fever':'Fever', 'Very Tired':'Very Tired', 'Nausea':'Nausea', 'Headache':'Headache', 'Body Aches':'Body Aches', 'Sore Throat':'Sore Throat', 'Other':'Other' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Strep Throat', 'RSV':'RSV', 'Valley Fever':'Valley Fever', 'Other':'Other' },
    ons: { 'Today':'Today', 'Yesterday':'Yesterday', 'This week':'This week', 'Last week':'Last week' },
    obs: { 'Dead birds nearby':'Dead birds nearby', 'Sick animals':'Sick animals', 'Unusual mosquito activity':'Unusual mosquito activity', 'Water issues':'Water issues', 'Air quality concerns':'Air quality concerns', 'Nothing unusual':'Nothing unusual' },
  },
  ES: {
    back: 'Atrás',
    feeling_h: '¿Cómo te\nsientes hoy?', feeling_s: 'Tu reporte ayuda a detectar amenazas de salud.',
    sick: 'Me siento enfermo', sick_d: 'Reportar síntomas, diagnóstico, gravedad',
    good: 'Me siento bien', good_d: 'Reportar observaciones del entorno',
    cat_h: '¿De qué\nse trata?', cat_s: 'Selecciona todo lo que aplique.',
    people: 'Personas', people_d: 'Tú, familia o amigos',
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
    what_diag: '¿Cuál fue tu diagnóstico?', severity: 'Gravedad',
    mild: 'Leve', mod: 'Moderada', sev: 'Grave',
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
    what_diag: 'Shaču ap ma:cina?', severity: 'Ge\'e',
    mild: 'Cem', mod: 'Ge', sev: 'Ge\'e',
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
export default function ReportFlow({ onSignUp, onSubmitComplete }: { onSignUp?: () => void; onSubmitComplete?: () => void }) {
  const sys = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const t = P[mode];

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
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSym, setOtherSym] = useState('');
  const [sickCount, setSickCount] = useState('1');
  const [zip, setZip] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [locL, setLocL] = useState(false);
  const [onset, setOnset] = useState('');
  const [diagnosed, setDiagnosed] = useState('');
  const [diagName, setDiagName] = useState('');
  const [severity, setSeverity] = useState('');
  const [observations, setObservations] = useState<string[]>([]);
  const [goodNotes, setGoodNotes] = useState('');

  const fa = useRef(new Animated.Value(1)).current;
  const sl = useRef(new Animated.Value(0)).current;
  const stepRef = useRef(step);
  stepRef.current = step;

  // Dynamic steps based on feeling
  const steps = feeling === 'sick'
    ? ['feeling', 'symptoms', 'assessment', 'done']
    : feeling === 'good'
      ? ['feeling', 'observations', 'done']
      : ['feeling', 'done'];

  const totalSteps = steps.length;
  const currentStepName = steps[step] || 'done';

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

  const getZip = async () => {
    setLocL(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed'); setLocL(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const g = await Location.reverseGeocodeAsync(loc.coords);
      if (g[0]?.postalCode) setZip(g[0].postalCode);
    } catch { Alert.alert('Error', 'Could not detect location'); }
    setLocL(false);
  };

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!r.canceled && r.assets[0]) setPhoto(r.assets[0].uri);
  };

  const submit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const payload = feeling === 'sick' ? {
      feeling: 'sick',
      category: cats,
      symptoms: symptoms.map(s => s.toLowerCase()),
      other_symptom_text: symptoms.includes('Other') ? otherSym : null,
      people_sick_count: parseInt(sickCount) || 1,
      zip_code: zip, photo,
      symptom_start: onset.toLowerCase(),
      professionally_diagnosed: diagnosed === 'Yes' ? true : diagnosed === 'No' ? false : null,
      diagnosis: diagnosed === 'Yes' ? diagName : null,
      severity: severity.toLowerCase(),
      submitted_at: new Date().toISOString(), id: uid(),
    } : {
      feeling: 'good',
      category: cats,
      observations,
      notes: goodNotes || null,
      zip_code: zip,
      submitted_at: new Date().toISOString(), id: uid(),
    };
    console.log('Report:', JSON.stringify(payload, null, 2));
    if (onSubmitComplete) onSubmitComplete();
    go(step + 1);
  };

  const reset = () => {
    setFeeling(''); setCats([]); setSymptoms([]); setOtherSym(''); setSickCount('1');
    setZip(''); setPhoto(null); setOnset(''); setDiagnosed('');
    setDiagName(''); setSeverity(''); setObservations([]); setGoodNotes('');
    setStep(0); fa.setValue(1); sl.setValue(0);
  };

  // ── Can continue? ──
  const canContinue = () => {
    switch (currentStepName) {
      case 'feeling': return feeling !== '' && cats.length > 0;
      case 'symptoms': return symptoms.length > 0 && zip.length === 5;
      case 'assessment': return onset !== '' && severity !== '';
      case 'observations': return zip.length === 5;
      default: return false;
    }
  };

  const isLastBeforeDone = steps[step + 1] === 'done';

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastBeforeDone) { submit(); } else { go(step + 1); }
  };

  const Chip = ({ label, icon, on, onP }: { label: string; icon?: keyof typeof Ionicons.glyphMap; on: boolean; onP: () => void }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onP} style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, marginRight: 8, marginBottom: 8,
      backgroundColor: on ? t.selBg : t.fill,
      borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
    }}>
      {icon && <Ionicons name={icon} size={15} color={on ? t.text : t.sub} />}
      <Text style={{ color: on ? t.text : t.sub, fontSize: 14, fontWeight: on ? '600' : '500' }}>{label}</Text>
    </TouchableOpacity>
  );

  const Heading = ({ children }: { children: string }) => (
    <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6, lineHeight: 34, marginBottom: 6 }}>{children}</Text>
  );

  const Sub = ({ children }: { children: string }) => (
    <Text style={{ color: t.sub, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>{children}</Text>
  );

  const Label = ({ children, icon }: { children: string; icon?: keyof typeof Ionicons.glyphMap }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, marginBottom: 10 }}>
      {icon && <Ionicons name={icon} size={13} color={t.sub} />}
      <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 }}>{children}</Text>
    </View>
  );

  // ── Screens ──
  const screen = () => {
    switch (currentStepName) {

      // ── Feeling + Category (combined) ──
      case 'feeling': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{loc.feeling_h}</Heading>
          <Sub>{loc.feeling_s}</Sub>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { id: 'sick', label: loc.sick, icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
              { id: 'good', label: loc.good, icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap },
            ].map(({ id, label, icon }) => {
              const on = feeling === id;
              return (
                <TouchableOpacity key={id} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFeeling(id); if (id === 'sick' && !cats.includes('people')) setCats(prev => [...prev, 'people']); }}
                  style={{
                    flex: 1, alignItems: 'center', gap: 10,
                    backgroundColor: on ? t.accentSoft : t.card, borderRadius: 16,
                    paddingVertical: 22, paddingHorizontal: 14,
                    borderWidth: 1.5, borderColor: on ? t.accent : 'transparent',
                  }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 13,
                    backgroundColor: on ? t.accentMid : t.fill,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={icon} size={20} color={on ? t.accent : t.sub} />
                  </View>
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 15, fontWeight: '600' }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label icon="layers-outline">{loc.cat_h.replace('\n', ' ')}</Label>

          {[
            { id: 'people', title: loc.people, desc: loc.people_d, icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'animals', title: loc.animals, desc: loc.animals_d, icon: 'paw-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'environment', title: loc.env, desc: loc.env_d, icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
          ].map(({ id, title, desc, icon }) => {
            const on = cats.includes(id);
            return (
              <TouchableOpacity key={id} activeOpacity={0.7}
                onPress={() => togArr(cats, setCats, id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: on ? t.accentSoft : t.card, borderRadius: 14,
                  paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8,
                  borderWidth: 1.5, borderColor: on ? t.accent : 'transparent',
                }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: on ? t.accentMid : t.fill,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={icon} size={18} color={on ? t.accent : t.sub} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
                  <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{desc}</Text>
                </View>
                <View style={{
                  width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
                  borderColor: on ? t.accent : t.hint,
                  backgroundColor: on ? t.accent : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Ionicons name="checkmark" size={13} color={t.inv} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );

      // ── Sick: Symptoms + Location ──
      case 'symptoms': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          <Heading>{loc.sym_h}</Heading>
          <Sub>{loc.cat_s}</Sub>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {SYMPTOMS.map(s => (
              <Chip key={s.id} label={(loc.sym as any)[s.id] || s.id} icon={s.icon} on={symptoms.includes(s.id)} onP={() => togArr(symptoms, setSymptoms, s.id)} />
            ))}
          </View>

          {symptoms.includes('Other') && (
            <TextInput style={{
              color: t.text, fontSize: 15, borderBottomWidth: 1, borderColor: t.line,
              paddingVertical: 10, marginTop: 4, marginBottom: 8,
            }} placeholder={loc.desc_sym} placeholderTextColor={t.hint}
              value={otherSym} onChangeText={setOtherSym} />
          )}

          <Label icon="people-outline">{loc.how_many}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              value={sickCount} onChangeText={v => setSickCount(v.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad" maxLength={3} />
          </View>

          <Label icon="location-outline">{loc.where}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              placeholder={loc.zip} placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={getZip}>
              <Text style={{ color: t.sub, fontSize: 13, fontWeight: '500' }}>{locL ? '…' : loc.detect}</Text>
            </TouchableOpacity>
          </View>

          <Label icon="camera-outline">{loc.photo_h}</Label>
          <TouchableOpacity activeOpacity={0.6} onPress={pickPhoto}
            style={{
              backgroundColor: t.card, borderRadius: 12, paddingVertical: 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <Ionicons name={photo ? 'checkmark-circle' : 'image-outline'} size={18} color={photo ? t.green : t.hint} />
            <Text style={{ color: photo ? t.green : t.sub, fontSize: 14, fontWeight: '500' }}>
              {photo ? loc.photo_added : loc.photo_add}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      );

      // ── Sick: Assessment ──
      case 'assessment': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{loc.more_h}</Heading>
          <Sub>{loc.more_s}</Sub>

          <Label icon="calendar-outline">{loc.when_start}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ONSET.map(o => <Chip key={o} label={(loc.ons as any)[o] || o} on={onset === o} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOnset(o); }} />)}
          </View>

          <Label icon="medkit-outline">{loc.prof_diag}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Yes', 'No', "Haven't seen a doctor"].map(d => {
              const dl = d === 'Yes' ? loc.yes : d === 'No' ? loc.no : loc.no_doc;
              return <Chip key={d} label={dl} on={diagnosed === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagnosed(d); }} />;
            })}
          </View>

          {diagnosed === 'Yes' && (
            <>
              <Label icon="clipboard-outline">{loc.what_diag}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {DIAGNOSES.map(d => <Chip key={d} label={(loc.diag as any)[d] || d} on={diagName === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagName(d); }} />)}
              </View>
            </>
          )}

          <Label icon="pulse-outline">{loc.severity}</Label>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Mild', 'Moderate', 'Severe'].map(s => {
              const sl = s === 'Mild' ? loc.mild : s === 'Moderate' ? loc.mod : loc.sev;
              const on = severity === s;
              return (
                <TouchableOpacity key={s} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSeverity(s); }}
                  style={{
                    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12,
                    backgroundColor: on ? t.selBg : t.card,
                    borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
                  }}>
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 14, fontWeight: '600' }}>{sl}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      );

      // ── Good: Observations ──
      case 'observations': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          <Heading>{loc.obs_h}</Heading>
          <Sub>{loc.obs_s}</Sub>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {OBSERVATIONS.map(o => (
              <Chip key={o.id} label={(loc.obs as any)[o.id] || o.id} icon={o.icon} on={observations.includes(o.id)} onP={() => togArr(observations, setObservations, o.id)} />
            ))}
          </View>

          <Label icon="location-outline">{loc.loc}</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              placeholder={loc.zip} placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={getZip}>
              <Text style={{ color: t.sub, fontSize: 13, fontWeight: '500' }}>{locL ? '…' : loc.detect}</Text>
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
      case 'done': return <Done t={t} mode={mode} reset={reset} onSignUp={onSignUp} loc={loc} />;
      default: return null;
    }
  };

  const isDone = currentStepName === 'done';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style={t.bar} />
        {!isDone && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20 }}>
            <View style={{ width: 50 }}>
              {step > 0 && (
                <TouchableOpacity onPress={() => go(step - 1)}>
                  <Text style={{ color: t.sub, fontSize: 15, fontWeight: '500' }}>{loc.back}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {steps.map((_, i) => (
                <View key={i} style={{ width: i === step ? 16 : 4, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.accent : t.line }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: 60, justifyContent: 'flex-end', gap: 10 }}>
              <Text style={{ color: t.hint, fontSize: 13 }}>{step + 1}/{totalSteps}</Text>
              <TouchableOpacity onPress={toggleSettings} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="settings-outline" size={20} color={t.sub} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Animated.View style={{ flex: 1, opacity: fa, transform: [{ translateY: sl }] }}>
          {screen()}
        </Animated.View>
        {!isDone && (
          <View style={{ paddingHorizontal: 24, paddingBottom: 8 }}>
            <TouchableOpacity activeOpacity={0.8} disabled={!canContinue()}
              onPress={handleNext}
              style={{
                backgroundColor: canContinue() ? t.accent : t.fill,
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              }}>
              <Text style={{ color: canContinue() ? t.inv : t.hint, fontSize: 16, fontWeight: '600' }}>
                {isLastBeforeDone ? loc.submit : loc.continue}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
              paddingHorizontal: 24, paddingBottom: 50, paddingTop: 32,
              transform: [{
                translateY: settingsAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] })
              }]
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }}>{loc.lang_theme}</Text>
                <TouchableOpacity onPress={toggleSettings} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ backgroundColor: t.fill, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={18} color={t.text} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: t.sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>{loc.sel_lang}</Text>
              <View style={{ gap: 8, marginBottom: 32 }}>
                {[
                  { id: 'EN', name: 'English', native: 'English' },
                  { id: 'ES', name: 'Spanish', native: 'Español' },
                  { id: 'TO', name: "Tohono O'odham", native: "O'odham ñiok" },
                ].map((l) => {
                  const on = lang === l.id;
                  return (
                    <TouchableOpacity key={l.id} activeOpacity={0.7}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLang(l.id as any); setTimeout(toggleSettings, 300); }}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: on ? t.selBg : t.fill, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
                        borderWidth: 1.5, borderColor: on ? t.text : 'transparent'
                      }}>
                      <View>
                        <Text style={{ color: t.text, fontSize: 16, fontWeight: on ? '600' : '500' }}>{l.native}</Text>
                        <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{l.name}</Text>
                      </View>
                      {on && <Ionicons name="checkmark-circle" size={22} color={t.text} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ color: t.sub, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>{loc.appearance}</Text>
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
                      <Text style={{ color: on ? t.text : t.sub, fontSize: 15, fontWeight: on ? '600' : '500' }}>{m.name}</Text>
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
function Done({ t, mode, reset, onSignUp, loc }: { t: Th; mode: string; reset: () => void; onSignUp?: () => void; loc: any }) {
  const sc = useRef(new Animated.Value(0)).current;
  const fd = useRef(new Animated.Value(0)).current;
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
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>{loc.thanks}</Text>
        <View style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 18, width: '100%', alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ color: t.hint, fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{loc.rep_near}</Text>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '700' }}>47</Text>
          <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{loc.pima}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8}
          style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="map-outline" size={16} color={t.text} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '500' }}>{loc.view_map}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reset(); }}
          style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="create-outline" size={16} color={t.inv} />
          <Text style={{ color: t.inv, fontSize: 15, fontWeight: '600' }}>{loc.rep_anon}</Text>
        </TouchableOpacity>
        {onSignUp && (
          <TouchableOpacity activeOpacity={0.8}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSignUp(); }}
            style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="person-add-outline" size={16} color={t.text} />
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '500' }}>{loc.signup}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}
