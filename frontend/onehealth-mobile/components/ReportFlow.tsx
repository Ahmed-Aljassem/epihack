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
import { useRouter } from 'expo-router';
import { addReport, reportToHeatPoints } from '@/lib/reports';

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
type Th = typeof P.light | typeof P.dark;

function uid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SYMPTOMS = ['Cough', 'Fever', 'Very Tired', 'Nausea', 'Headache', 'Body Aches', 'Sore Throat', 'Other'];
const DIAGNOSES = ['Influenza A', 'Influenza B', 'COVID-19', 'Norovirus', 'Strep Throat', 'RSV', 'Valley Fever', 'Other'];
const ONSET = ['Today', 'Yesterday', 'This week', 'Last week'];
const OBSERVATIONS = ['Dead birds nearby', 'Sick animals', 'Unusual mosquito activity', 'Water issues', 'Air quality concerns', 'Nothing unusual'];

// ─────────────────────────────────────────────────────────────
export default function ReportFlow({ onSignUp }: { onSignUp?: () => void }) {
  const sys = useColorScheme();
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const t = P[mode];

  const [step, setStep] = useState(0);

  // Data
  const [feeling, setFeeling] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSym, setOtherSym] = useState('');
  const [sickCount, setSickCount] = useState('1');
  const [zip, setZip] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
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

  // Dynamic steps based on feeling
  const steps = feeling === 'sick'
    ? ['feeling', 'category', 'symptoms', 'assessment', 'done']
    : ['feeling', 'category', 'observations', 'done'];

  const totalSteps = steps.length;
  const currentStepName = steps[step] || 'done';

  const go = useCallback((n: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const d = n > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(fa, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(sl, { toValue: -14 * d, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      setStep(n); sl.setValue(14 * d);
      Animated.parallel([
        Animated.timing(fa, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(sl, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    });
  }, [step]);

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
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
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
      zip_code: zip, coords, photo,
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
      zip_code: zip, coords,
      submitted_at: new Date().toISOString(), id: uid(),
    };
    console.log('Report:', JSON.stringify(payload, null, 2));
    addReport(reportToHeatPoints(payload));
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
      case 'feeling': return feeling !== '';
      case 'category': return cats.length > 0;
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

  const Chip = ({ label, on, onP }: { label: string; on: boolean; onP: () => void }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onP} style={{
      paddingVertical: 10, paddingHorizontal: 18, borderRadius: 100, marginRight: 8, marginBottom: 8,
      backgroundColor: on ? t.selBg : t.fill,
      borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
    }}>
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

      // ── Feeling ──
      case 'feeling': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{'How are you\nfeeling today?'}</Heading>
          <Sub>Your report helps Arizona detect health threats early.</Sub>

          <View style={{ gap: 10 }}>
            {[
              { id: 'sick', label: 'Feeling Sick', desc: 'Report symptoms, diagnosis, severity', icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
              { id: 'good', label: 'Feeling Good', desc: 'Report environmental or animal observations', icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap },
            ].map(({ id, label, desc, icon }) => {
              const on = feeling === id;
              return (
                <TouchableOpacity key={id} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFeeling(id); if (id === 'sick' && !cats.includes('people')) setCats(prev => [...prev, 'people']); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: on ? t.accentSoft : t.card, borderRadius: 16,
                    paddingVertical: 20, paddingHorizontal: 18,
                    borderWidth: 1.5, borderColor: on ? t.accent : 'transparent',
                  }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 13,
                    backgroundColor: on ? t.accentMid : t.fill,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={icon} size={20} color={on ? t.accent : t.sub} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
                    <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{desc}</Text>
                  </View>
                  {on && <Ionicons name="checkmark-circle" size={22} color={t.accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      );

      // ── Category ──
      case 'category': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{'What is this\nabout?'}</Heading>
          <Sub>Select all that apply.</Sub>

          {[
            { id: 'people', title: 'People', desc: 'Yourself, family, or friends', icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'animals', title: 'Animals', desc: 'Pets, farm animals, or wildlife', icon: 'paw-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'environment', title: 'Environment', desc: 'Water, air, plants, or places', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
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
          <Heading>{'What symptoms\nare you having?'}</Heading>
          <Sub>Select all that apply.</Sub>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {SYMPTOMS.map(s => (
              <Chip key={s} label={s} on={symptoms.includes(s)} onP={() => togArr(symptoms, setSymptoms, s)} />
            ))}
          </View>

          {symptoms.includes('Other') && (
            <TextInput style={{
              color: t.text, fontSize: 15, borderBottomWidth: 1, borderColor: t.line,
              paddingVertical: 10, marginTop: 4, marginBottom: 8,
            }} placeholder="Describe symptom…" placeholderTextColor={t.hint}
              value={otherSym} onChangeText={setOtherSym} />
          )}

          <Label icon="people-outline">How many people are sick?</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              value={sickCount} onChangeText={v => setSickCount(v.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad" maxLength={3} />
          </View>

          <Label icon="location-outline">Where are you located?</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              placeholder="Zip code" placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={getZip}>
              <Text style={{ color: t.sub, fontSize: 13, fontWeight: '500' }}>{locL ? '…' : 'Detect'}</Text>
            </TouchableOpacity>
          </View>

          <Label icon="camera-outline">Optional photo</Label>
          <TouchableOpacity activeOpacity={0.6} onPress={pickPhoto}
            style={{
              backgroundColor: t.card, borderRadius: 12, paddingVertical: 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <Ionicons name={photo ? 'checkmark-circle' : 'image-outline'} size={18} color={photo ? t.green : t.hint} />
            <Text style={{ color: photo ? t.green : t.sub, fontSize: 14, fontWeight: '500' }}>
              {photo ? 'Photo attached' : 'Tap to add photo'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      );

      // ── Sick: Assessment ──
      case 'assessment': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{'A few more\ndetails'}</Heading>
          <Sub>This helps our analysis.</Sub>

          <Label icon="calendar-outline">When did symptoms start?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ONSET.map(o => <Chip key={o} label={o} on={onset === o} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOnset(o); }} />)}
          </View>

          <Label icon="medkit-outline">Were you professionally diagnosed?</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Yes', 'No', "Haven't seen a doctor"].map(d => <Chip key={d} label={d} on={diagnosed === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagnosed(d); }} />)}
          </View>

          {diagnosed === 'Yes' && (
            <>
              <Label icon="clipboard-outline">What were you diagnosed with?</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {DIAGNOSES.map(d => <Chip key={d} label={d} on={diagName === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagName(d); }} />)}
              </View>
            </>
          )}

          <Label icon="pulse-outline">Severity</Label>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['Mild', 'Moderate', 'Severe'].map(s => {
              const on = severity === s;
              return (
                <TouchableOpacity key={s} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSeverity(s); }}
                  style={{
                    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12,
                    backgroundColor: on ? t.selBg : t.card,
                    borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
                  }}>
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 14, fontWeight: '600' }}>{s}</Text>
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
          <Heading>{'What have you\nobserved?'}</Heading>
          <Sub>Report anything unusual in your environment.</Sub>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {OBSERVATIONS.map(o => (
              <Chip key={o} label={o} on={observations.includes(o)} onP={() => togArr(observations, setObservations, o)} />
            ))}
          </View>

          <Label icon="location-outline">Your location</Label>
          <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
            <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontWeight: '600', paddingVertical: 14 }}
              placeholder="Zip code" placeholderTextColor={t.hint}
              value={zip} onChangeText={v => setZip(v.replace(/\D/g, '').slice(0, 5))}
              keyboardType="number-pad" maxLength={5} />
            <TouchableOpacity onPress={getZip}>
              <Text style={{ color: t.sub, fontSize: 13, fontWeight: '500' }}>{locL ? '…' : 'Detect'}</Text>
            </TouchableOpacity>
          </View>

          <Label icon="document-text-outline">Notes (optional)</Label>
          <TextInput style={{
            backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15,
            paddingHorizontal: 16, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top',
          }} placeholder="Any additional details…" placeholderTextColor={t.hint}
            value={goodNotes} onChangeText={setGoodNotes} multiline />
        </ScrollView>
      );

      // ── Done ──
      case 'done': return <Done t={t} mode={mode} reset={reset} onSignUp={onSignUp} />;
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
            {step > 0 ? (
              <TouchableOpacity onPress={() => go(step - 1)} style={{ width: 50 }}>
                <Text style={{ color: t.sub, fontSize: 15, fontWeight: '500' }}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setMode(m => m === 'light' ? 'dark' : 'light')} style={{ width: 50 }}>
                <Text style={{ color: t.sub, fontSize: 13, fontWeight: '500' }}>{mode === 'light' ? 'Dark' : 'Light'}</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {steps.map((_, i) => (
                <View key={i} style={{ width: i === step ? 16 : 4, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.accent : t.line }} />
              ))}
            </View>
            <Text style={{ color: t.hint, fontSize: 13, width: 50, textAlign: 'right' }}>{step + 1}/{totalSteps}</Text>
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
                {isLastBeforeDone ? 'Submit Report' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─── Confirmation ────────────────────────────────────────────
function Done({ t, mode, reset, onSignUp }: { t: Th; mode: string; reset: () => void; onSignUp?: () => void }) {
  const router = useRouter();
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
        <Text style={{ color: t.text, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Thank you!</Text>
        {/* <Text style={{ color: t.sub, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 }}>
          Your anonymous report helps{'\n'}protect Arizona communities.
        </Text> */}
        <View style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 18, width: '100%', alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ color: t.hint, fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Reports near you this week</Text>
          <Text style={{ color: t.text, fontSize: 32, fontWeight: '700' }}>47</Text>
          <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>across Pima County</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/map'); }}
          style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="map-outline" size={16} color={t.text} />
          <Text style={{ color: t.text, fontSize: 15, fontWeight: '500' }}>View Map</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); reset(); }}
          style={{ backgroundColor: t.accent, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="create-outline" size={16} color={t.inv} />
          <Text style={{ color: t.inv, fontSize: 15, fontWeight: '600' }}>Report Another</Text>
        </TouchableOpacity>
        {onSignUp && (
          <TouchableOpacity activeOpacity={0.8}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSignUp(); }}
            style={{ backgroundColor: t.card, borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Ionicons name="person-add-outline" size={16} color={t.text} />
            <Text style={{ color: t.text, fontSize: 15, fontWeight: '500' }}>Sign Up to Track Reports</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}
