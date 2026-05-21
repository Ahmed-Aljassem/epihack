const fs = require('fs');
const oldCode = fs.readFileSync('components/flows/ReportFlow.tsx', 'utf8');

// The new arrays
const newConstants = `
const SYMPTOMS = [
  { id: 'Cough', icon: 'medical-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Fever', icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Sore Throat', icon: 'volume-low-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Fatigue', icon: 'bed-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Headache', icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Body Aches', icon: 'body-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Nausea/Vomiting', icon: 'water-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Diarrhea', icon: 'water-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Congestion', icon: 'medical-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Rash', icon: 'body-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Difficulty Breathing', icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Loss of Taste/Smell', icon: 'restaurant-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'Other', icon: 'add-outline' as keyof typeof Ionicons.glyphMap },
];

const DIAGNOSES = ['Influenza A', 'Influenza B', 'COVID-19', 'Norovirus', 'RSV', 'Strep Throat', 'Valley Fever', 'Pneumonia', 'Tuberculosis', 'Other'];
const ONSET = ['Today', 'Yesterday', '2-3 days ago', 'This week', 'Last week', 'More than 2 weeks'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Critical'];

const ANIMAL_TYPES = ['Dog', 'Cat', 'Bird', 'Poultry/Chicken', 'Livestock (cow/horse/pig)', 'Wild animal', 'Other'];
const ANIMAL_OBS = ['Found dead', 'Looks sick', 'Acting unusual', 'Multiple affected', 'Unusual number of insects on/around animal'];
const ANIMAL_SETTINGS = ['Indoors', 'Outdoors/yard', 'Farm/ranch', 'Wild/nature', 'Near water', 'Road/street'];

const ENV_OBS = ['Standing water', 'Mosquito swarms', 'Unusual smell', 'Poor air quality/haze', 'Contaminated water', 'Dead vegetation/crops', 'Dust storm/heavy dust', 'Flooding', 'Illegal dumping', 'Other'];
const ENV_TIMING = ['Today', 'Yesterday', 'This week', 'Ongoing (more than a week)'];
const ENV_SETTINGS = ['Near river/creek/lake', 'Residential area', 'Agricultural/farm land', 'Public park/space', 'School/campus', 'Workplace', 'Road/highway'];
`;

let newCode = oldCode.replace(/const SYMPTOMS = \[([\s\S]*?)\];\s*const DIAGNOSES = \[.*?\];\s*const ONSET = \[.*?\];\s*const OBSERVATIONS = \[[\s\S]*?\];/, newConstants.trim() + '\n');

// Replace the states inside ReportFlow
const newStates = `
  // Data
  const [feeling, setFeeling] = useState('');
  const [cats, setCats] = useState<string[]>([]);
  // People
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [otherSym, setOtherSym] = useState('');
  const [sickCount, setSickCount] = useState('1');
  // Animals
  const [animalType, setAnimalType] = useState('');
  const [animalObs, setAnimalObs] = useState<string[]>([]);
  const [animalCount, setAnimalCount] = useState('1');
  const [animalSetting, setAnimalSetting] = useState('');
  const [animalNotes, setAnimalNotes] = useState('');
  // Environment
  const [envObs, setEnvObs] = useState<string[]>([]);
  const [envTiming, setEnvTiming] = useState('');
  const [envSetting, setEnvSetting] = useState('');
  const [envNotes, setEnvNotes] = useState('');
  // Location
  const [zip, setZip] = useState('');
  const [locMethod, setLocMethod] = useState<'manual'|'gps'>('manual');
  const [areaName, setAreaName] = useState<string|null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [locL, setLocL] = useState(false);
  // Assessment
  const [onset, setOnset] = useState('');
  const [diagnosed, setDiagnosed] = useState('');
  const [diagName, setDiagName] = useState('');
  const [severity, setSeverity] = useState('');
`;

newCode = newCode.replace(/\/\/ Data[\s\S]*?const \[goodNotes, setGoodNotes\] = useState\(''\);/, newStates.trim());

const newSteps = `
  const hasAssessment = feeling === 'sick' && cats.includes('people');
  const steps = ['feeling', 'details'];
  if (hasAssessment) steps.push('assessment');
  steps.push('done');
`;

newCode = newCode.replace(/\/\/ Dynamic steps based on feeling[\s\S]*?:\s*\['feeling', 'done'\];/, newSteps.trim());

// replace getZip
const newGetZip = `
  const getZip = async () => {
    setLocL(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed'); setLocL(false); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const g = await Location.reverseGeocodeAsync(loc.coords);
      if (g[0]?.postalCode) {
        setZip(g[0].postalCode);
        setLocMethod('gps');
        setAreaName(g[0].city || g[0].subregion || g[0].region || null);
      }
    } catch { Alert.alert('Error', 'Could not detect location'); }
    setLocL(false);
  };
`;
newCode = newCode.replace(/const getZip = async \(\) => \{[\s\S]*?setLocL\(false\);\n  \};/, newGetZip.trim());

// replace submit
const newSubmit = `
  const submit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const payload: any = {
      id: uid(),
      submitted_at: new Date().toISOString(),
      feeling,
      categories: cats,
      people: null,
      animals: null,
      environment: null,
      location: {
        zip_code: zip,
        method: locMethod,
        area_name: areaName
      },
      photo_uri: photo,
      assessment: null
    };

    if (feeling === 'sick' && cats.includes('people')) {
      payload.people = {
        symptoms: symptoms.map(s => s.toLowerCase().replace(/ /g, '_')),
        other_symptom_text: symptoms.includes('Other') ? otherSym : null,
        people_sick_count: parseInt(sickCount) || 1
      };
      payload.assessment = {
        symptom_start: onset.toLowerCase().replace(/ /g, '_'),
        professionally_diagnosed: diagnosed === 'Yes' ? true : diagnosed === 'No' ? false : null,
        diagnosis: diagnosed === 'Yes' ? diagName : null,
        severity: severity.toLowerCase()
      };
    }

    if (cats.includes('animals')) {
      payload.animals = {
        animal_type: animalType.toLowerCase().replace(/ /g, '_'),
        observations: animalObs.map(o => o.toLowerCase().replace(/ /g, '_')),
        count: parseInt(animalCount) || 1,
        setting: animalSetting.toLowerCase().replace(/ /g, '_'),
        notes: animalNotes || null
      };
    }

    if (cats.includes('environment')) {
      payload.environment = {
        observations: envObs.map(o => o.toLowerCase().replace(/ /g, '_')),
        timing: envTiming.toLowerCase().replace(/ /g, '_'),
        setting: envSetting.toLowerCase().replace(/ /g, '_'),
        notes: envNotes || null
      };
    }

    console.log('Report:', JSON.stringify(payload, null, 2));
    if (onSubmitComplete) onSubmitComplete();
    go(step + 1);
  };
`;

newCode = newCode.replace(/const submit = \(\) => \{[\s\S]*?go\(step \+ 1\);\n  \};/, newSubmit.trim());

// replace reset
const newReset = `
  const reset = () => {
    setFeeling(''); setCats([]); 
    setSymptoms([]); setOtherSym(''); setSickCount('1');
    setAnimalType(''); setAnimalObs([]); setAnimalCount('1'); setAnimalSetting(''); setAnimalNotes('');
    setEnvObs([]); setEnvTiming(''); setEnvSetting(''); setEnvNotes('');
    setZip(''); setLocMethod('manual'); setAreaName(null); setPhoto(null);
    setOnset(''); setDiagnosed(''); setDiagName(''); setSeverity('');
    setStep(0); fa.setValue(1); sl.setValue(0);
  };
`;
newCode = newCode.replace(/const reset = \(\) => \{[\s\S]*?sl\.setValue\(0\);\n  \};/, newReset.trim());

// replace canContinue
const newCanContinue = `
  // ── Can continue? ──
  const canContinue = () => {
    switch (currentStepName) {
      case 'feeling': return feeling !== '' && cats.length > 0;
      case 'details':
        let ok = zip.length === 5;
        if (feeling === 'sick' && cats.includes('people')) {
          if (symptoms.length === 0 || !sickCount) ok = false;
        }
        if (cats.includes('animals')) {
          if (!animalType || animalObs.length === 0 || !animalCount || !animalSetting) ok = false;
        }
        if (cats.includes('environment')) {
          if (envObs.length === 0 || !envTiming || !envSetting) ok = false;
        }
        return ok;
      case 'assessment': return onset !== '' && severity !== '';
      default: return false;
    }
  };
`;
newCode = newCode.replace(/\/\/ ── Can continue\? ──[\s\S]*?const isLastBeforeDone = steps\[step \+ 1\] === 'done';/, newCanContinue.trim() + '\n\n  const isLastBeforeDone = steps[step + 1] === \'done\';');

// Let's replace the screens
const newScreens = `
      // ── Feeling + Category (combined) ──
      case 'feeling': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{loc.feeling_h || 'How are you feeling today?'}</Heading>
          <Sub>{loc.feeling_s || 'Your report helps detect health threats.'}</Sub>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { id: 'sick', label: loc.sick || 'Feeling Sick', icon: 'thermometer-outline' as keyof typeof Ionicons.glyphMap },
              { id: 'good', label: loc.good || 'Feeling Good', icon: 'sunny-outline' as keyof typeof Ionicons.glyphMap },
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
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 15, fontFamily: 'Manrope_600SemiBold' }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Label icon="layers-outline">{(loc.cat_h || 'What is this about?').replace(/\\n/g, ' ')}</Label>

          {[
            { id: 'people', title: loc.people || 'People', desc: loc.people_d || 'Yourself, family, or friends', icon: 'person-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'animals', title: loc.animals || 'Animals', desc: loc.animals_d || 'Pets, farm animals, or wildlife', icon: 'paw-outline' as keyof typeof Ionicons.glyphMap },
            { id: 'environment', title: loc.env || 'Environment', desc: loc.env_d || 'Water, air, plants, or places', icon: 'leaf-outline' as keyof typeof Ionicons.glyphMap },
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
                  <Text style={{ color: t.text, fontSize: 15, fontFamily: 'Manrope_600SemiBold' }}>{title}</Text>
                  <Text style={{ fontFamily: 'Manrope_400Regular',  color: t.sub, fontSize: 12, marginTop: 2 }}>{desc}</Text>
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

      // ── Dynamic Details ──
      case 'details': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Heading>{loc.details_h || 'Details'}</Heading>
          <Sub>{loc.details_s || 'Please provide more info.'}</Sub>

          {feeling === 'sick' && cats.includes('people') && (
            <View style={{ marginBottom: 24 }}>
              <Label icon="person-outline">PEOPLE ILLNESS</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {SYMPTOMS.map(s => (
                  <Chip key={s.id} label={(loc.sym && (loc.sym as any)[s.id]) || s.id} icon={s.icon} on={symptoms.includes(s.id)} onP={() => togArr(symptoms, setSymptoms, s.id)} />
                ))}
              </View>
              {symptoms.includes('Other') && (
                <TextInput style={{
                  color: t.text, fontSize: 15, borderBottomWidth: 1, borderColor: t.line,
                  paddingVertical: 10, marginTop: 4, marginBottom: 8, fontFamily: 'Manrope_500Medium'
                }} placeholder={loc.desc_sym || 'Describe symptom...'} placeholderTextColor={t.hint}
                  value={otherSym} onChangeText={setOtherSym} />
              )}
              <Label icon="people-outline">{loc.how_many || 'How many people are sick?'}</Label>
              <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.line }}>
                <Ionicons name="person-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: 14 }}
                  value={sickCount} onChangeText={v => setSickCount(v.replace(/\\D/g, '').slice(0, 2))}
                  keyboardType="number-pad" maxLength={2} />
              </View>
            </View>
          )}

          {cats.includes('animals') && (
            <View style={{ marginBottom: 24, borderTopWidth: 1, borderColor: t.line, paddingTop: 16 }}>
              <Label icon="paw-outline">ANIMAL OBSERVATION</Label>
              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>What kind of animal?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ANIMAL_TYPES.map(a => <Chip key={a} label={a} on={animalType === a} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAnimalType(a); }} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>What did you observe?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ANIMAL_OBS.map(o => <Chip key={o} label={o} on={animalObs.includes(o)} onP={() => togArr(animalObs, setAnimalObs, o)} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>How many animals?</Text>
              <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.line, marginBottom: 16 }}>
                <Ionicons name="apps-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
                <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: 14 }}
                  value={animalCount} onChangeText={v => setAnimalCount(v.replace(/\\D/g, '').slice(0, 2))}
                  keyboardType="number-pad" maxLength={2} />
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>Where was the animal?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ANIMAL_SETTINGS.map(s => <Chip key={s} label={s} on={animalSetting === s} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAnimalSetting(s); }} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>Notes (Optional)</Text>
              <TextInput style={{
                backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 16, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top', fontFamily: 'Manrope_500Medium'
              }} placeholder="Any additional details..." placeholderTextColor={t.hint}
                value={animalNotes} onChangeText={setAnimalNotes} multiline />
            </View>
          )}

          {cats.includes('environment') && (
            <View style={{ marginBottom: 24, borderTopWidth: 1, borderColor: t.line, paddingTop: 16 }}>
              <Label icon="leaf-outline">ENVIRONMENT OBSERVATION</Label>
              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>What did you observe?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ENV_OBS.map(o => <Chip key={o} label={o} on={envObs.includes(o)} onP={() => togArr(envObs, setEnvObs, o)} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>When did it start?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ENV_TIMING.map(t => <Chip key={t} label={t} on={envTiming === t} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnvTiming(t); }} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>What is the setting?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
                {ENV_SETTINGS.map(s => <Chip key={s} label={s} on={envSetting === s} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEnvSetting(s); }} />)}
              </View>

              <Text style={{ color: t.text, fontSize: 13, fontFamily: 'Manrope_600SemiBold', marginBottom: 8 }}>Notes (Optional, max 280)</Text>
              <TextInput style={{
                backgroundColor: t.card, borderRadius: 12, color: t.text, fontSize: 15, borderWidth: 1, borderColor: t.line,
                paddingHorizontal: 16, paddingVertical: 12, minHeight: 70, textAlignVertical: 'top', fontFamily: 'Manrope_500Medium'
              }} placeholder="Any additional details..." placeholderTextColor={t.hint}
                value={envNotes} onChangeText={setEnvNotes} maxLength={280} multiline />
            </View>
          )}

          <View style={{ borderTopWidth: 1, borderColor: t.line, paddingTop: 16 }}>
            <Label icon="location-outline">{loc.where || 'LOCATION'}</Label>
            <View style={{ backgroundColor: t.card, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.line }}>
              <Ionicons name="navigate-outline" size={16} color={t.hint} style={{ marginRight: 10 }} />
              <TextInput style={{ flex: 1, color: t.text, fontSize: 16, fontFamily: 'Manrope_600SemiBold', paddingVertical: 14 }}
                placeholder={loc.zip || 'Zip Code'} placeholderTextColor={t.hint}
                value={zip} onChangeText={v => { setZip(v.replace(/\\D/g, '').slice(0, 5)); setLocMethod('manual'); setAreaName(null); }}
                keyboardType="number-pad" maxLength={5} />
              <TouchableOpacity onPress={getZip}>
                <Text style={{ color: t.sub, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{locL ? '…' : loc.detect}</Text>
              </TouchableOpacity>
            </View>

            <Label icon="camera-outline">{loc.photo_h || 'PHOTO'}</Label>
            <TouchableOpacity activeOpacity={0.6} onPress={pickPhoto}
              style={{
                backgroundColor: t.card, borderRadius: 12, paddingVertical: 18, borderWidth: 1, borderColor: t.line,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <Ionicons name={photo ? 'checkmark-circle' : 'image-outline'} size={18} color={photo ? t.green : t.hint} />
              <Text style={{ color: photo ? t.green : t.sub, fontSize: 14, fontFamily: 'Manrope_500Medium' }}>
                {photo ? loc.photo_added || 'Photo attached' : loc.photo_add || 'Tap to add photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );

      // ── Sick: Assessment ──
      case 'assessment': return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          <Heading>{loc.more_h || 'A few more details'}</Heading>
          <Sub>{loc.more_s || 'This helps our analysis.'}</Sub>

          <Label icon="calendar-outline">{loc.when_start || 'WHEN DID SYMPTOMS START?'}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ONSET.map(o => <Chip key={o} label={o} on={onset === o} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOnset(o); }} />)}
          </View>

          <Label icon="medkit-outline">{loc.prof_diag || 'WERE YOU PROFESSIONALLY DIAGNOSED?'}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['Yes', 'No', "Haven't seen a doctor"].map(d => {
              return <Chip key={d} label={d} on={diagnosed === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagnosed(d); }} />;
            })}
          </View>

          {diagnosed === 'Yes' && (
            <>
              <Label icon="clipboard-outline">{loc.what_diag || 'WHAT WERE YOU DIAGNOSED WITH?'}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {DIAGNOSES.map(d => <Chip key={d} label={d} on={diagName === d} onP={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDiagName(d); }} />)}
              </View>
            </>
          )}

          <Label icon="pulse-outline">{loc.severity || 'SEVERITY'}</Label>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {SEVERITIES.map(s => {
              const on = severity === s;
              return (
                <TouchableOpacity key={s} activeOpacity={0.7}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSeverity(s); }}
                  style={{
                    flexBasis: '48%', paddingVertical: 14, alignItems: 'center', borderRadius: 12, marginBottom: 8,
                    backgroundColor: on ? t.selBg : t.card,
                    borderWidth: 1.5, borderColor: on ? t.text : 'transparent',
                  }}>
                  <Text style={{ color: on ? t.text : t.sub, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      );
`;

newCode = newCode.replace(/\/\/ ── Feeling \+ Category \(combined\) ──[\s\S]*?\/\/ ── Done ──/, newScreens.trim() + '\n\n      // ── Done ──');

fs.writeFileSync('components/flows/ReportFlow.tsx', newCode);
