import { useState, useEffect } from 'react';
import { getLang, setLang as setStorageLang } from './storage';

export const I18N = {
  EN: {
    back: 'Back', feeling_h: 'How are you\nfeeling today?', feeling_s: 'Your report helps Arizona detect health threats early.',
    sick: 'Feeling Sick', sick_d: 'Report symptoms, diagnosis, severity', good: 'Feeling Good', good_d: 'Report environmental or animal observations',
    cat_h: 'What is this\nabout?', cat_s: 'Select all that apply.', people: 'People', people_d: 'Yourself, family, or friends',
    animals: 'Animals', animals_d: 'Pets, farm animals, or wildlife', env: 'Environment', env_d: 'Water, air, plants, or places',
    lang_theme: 'Language & Theme', sel_lang: 'Select Language', appearance: 'Appearance', light: 'Light', dark: 'Dark',
    sym_h: 'What symptoms\nare you having?', desc_sym: 'Describe symptom…', how_many: 'How many people are sick?', where: 'Where are you located?',
    zip: 'Zip code', detect: 'Detect', photo_h: 'Optional photo', photo_add: 'Tap to add photo', photo_added: 'Photo attached',
    more_h: 'A few more\ndetails', more_s: 'This helps our analysis.', when_start: 'When did symptoms start?', prof_diag: 'Were you professionally diagnosed?',
    yes: 'Yes', no: 'No', no_doc: "Haven't seen a doctor", what_diag: 'What were you diagnosed with?', severity: 'Severity',
    mild: 'Mild', mod: 'Moderate', sev: 'Severe', obs_h: 'What have you\nobserved?', obs_s: 'Report anything unusual in your environment.',
    loc: 'Your location', notes: 'Notes (optional)', any_det: 'Any additional details…', thanks: 'Thank you!', rep_near: 'Reports near you this week', pima: 'across Pima County',
    view_map: 'View Map', rep_anon: 'Report Another', signup: 'Sign Up to Track Reports', submit: 'Submit Report', continue: 'Continue',
    sym: { 'Cough':'Cough', 'Fever':'Fever', 'Very Tired':'Very Tired', 'Nausea':'Nausea', 'Headache':'Headache', 'Body Aches':'Body Aches', 'Sore Throat':'Sore Throat', 'Other':'Other' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Strep Throat', 'RSV':'RSV', 'Valley Fever':'Valley Fever', 'Other':'Other' },
    ons: { 'Today':'Today', 'Yesterday':'Yesterday', 'This week':'This week', 'Last week':'Last week' },
    obs: { 'Dead birds nearby':'Dead birds nearby', 'Sick animals':'Sick animals', 'Unusual mosquito activity':'Unusual mosquito activity', 'Water issues':'Water issues', 'Air quality concerns':'Air quality concerns', 'Nothing unusual':'Nothing unusual' },
    
    // Dashboard additions
    dash_env: 'Environment', dash_health: 'Health near you', dash_alert: 'Alert', dash_forecast: 'Forecast', 
    dash_quick: 'Quick report', dash_impact: 'Your impact', dash_recent: 'Recent near you',
    rep_sub: 'Reports submitted', see_all: 'See all reports', 
    v_temp: 'Temperature', v_air: 'Air Quality', v_pol: 'Pollen', v_uv: 'UV Index', v_hum: 'Humidity',
    map_stats: 'State Stats', total_rep: 'Total Reports', top_iss: 'Top Issue'
  },
  ES: {
    back: 'Atrás', feeling_h: '¿Cómo te\nsientes hoy?', feeling_s: 'Tu reporte ayuda a detectar amenazas de salud.',
    sick: 'Me siento enfermo', sick_d: 'Reportar síntomas, diagnóstico, gravedad', good: 'Me siento bien', good_d: 'Reportar observaciones del entorno',
    cat_h: '¿De qué\nse trata?', cat_s: 'Selecciona todo lo que aplique.', people: 'Personas', people_d: 'Tú, familia o amigos',
    animals: 'Animales', animals_d: 'Mascotas o vida silvestre', env: 'Entorno', env_d: 'Agua, aire, plantas o lugares',
    lang_theme: 'Idioma y Tema', sel_lang: 'Seleccionar Idioma', appearance: 'Apariencia', light: 'Claro', dark: 'Oscuro',
    sym_h: '¿Qué síntomas\ntienes?', desc_sym: 'Describe el síntoma…', how_many: '¿Cuántas personas están enfermas?', where: '¿Dónde te encuentras?',
    zip: 'Código postal', detect: 'Detectar', photo_h: 'Foto opcional', photo_add: 'Toca para añadir', photo_added: 'Foto adjunta',
    more_h: 'Algunos\ndetalles más', more_s: 'Esto ayuda a nuestro análisis.', when_start: '¿Cuándo empezaron?', prof_diag: '¿Fuiste diagnosticado?',
    yes: 'Sí', no: 'No', no_doc: "No he visto a un médico", what_diag: '¿Cuál fue tu diagnóstico?', severity: 'Gravedad',
    mild: 'Leve', mod: 'Moderada', sev: 'Grave', obs_h: '¿Qué has\nobservado?', obs_s: 'Reporta algo inusual en tu entorno.',
    loc: 'Tu ubicación', notes: 'Notas (opcional)', any_det: 'Detalles adicionales…', thanks: '¡Gracias!', rep_near: 'Reportes cerca de ti esta semana', pima: 'en todo el condado',
    view_map: 'Ver Mapa', rep_anon: 'Reportar Otro', signup: 'Regístrate para ver', submit: 'Enviar Reporte', continue: 'Continuar',
    sym: { 'Cough':'Tos', 'Fever':'Fiebre', 'Very Tired':'Muy cansado', 'Nausea':'Náuseas', 'Headache':'Dolor de cabeza', 'Body Aches':'Dolores musculares', 'Sore Throat':'Dolor de garganta', 'Other':'Otro' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Faringitis estreptocócica', 'RSV':'VSR', 'Valley Fever':'Fiebre del Valle', 'Other':'Otro' },
    ons: { 'Today':'Hoy', 'Yesterday':'Ayer', 'This week':'Esta semana', 'Last week':'La semana pasada' },
    obs: { 'Dead birds nearby':'Pájaros muertos', 'Sick animals':'Animales enfermos', 'Unusual mosquito activity':'Actividad inusual de mosquitos', 'Water issues':'Problemas de agua', 'Air quality concerns':'Calidad del aire', 'Nothing unusual':'Nada inusual' },
    
    dash_env: 'Entorno', dash_health: 'Salud cerca de ti', dash_alert: 'Alerta', dash_forecast: 'Pronóstico', 
    dash_quick: 'Reporte rápido', dash_impact: 'Tu impacto', dash_recent: 'Reciente cerca de ti',
    rep_sub: 'Reportes enviados', see_all: 'Ver todos los reportes',
    v_temp: 'Temperatura', v_air: 'Calidad del aire', v_pol: 'Polen', v_uv: 'Índice UV', v_hum: 'Humedad',
    map_stats: 'Estadísticas', total_rep: 'Reportes Totales', top_iss: 'Problema Principal'
  },
  TO: {
    back: 'Atrás', feeling_h: 'Shaču p-e-ta:tk\ne-da:m?', feeling_s: 'E-a:ga o a:pi e-ñiok.',
    sick: 'S-ko:k', sick_d: 'A:g haicu s-ko:k', good: 'S-ape', good_d: 'A:g haicu s-ape',
    cat_h: 'Haicu ahu\ni:da?', cat_s: 'A:g haicu.', people: 'Hemaajkam', people_d: 'A:pi, ha-ñiok',
    animals: "Ha'icu doakam", animals_d: 'Gogs, cewag', env: 'Jewed', env_d: 'Su:dagi, jewed',
    lang_theme: 'Ñiok & Theme', sel_lang: 'Ñiok', appearance: 'Appearance', light: 'Light', dark: 'Dark',
    sym_h: 'Shaču s-ko:k?', desc_sym: 'A:g...', how_many: 'He\'ekia hemaajkam s-ko:k?', where: 'Hebai ap?',
    zip: 'Zip code', detect: 'S-mah', photo_h: 'Koaia', photo_add: 'Tatk koaia', photo_added: 'Koaia ap',
    more_h: 'Haicu ha-we:hejed', more_s: 'Ap s-ap.', when_start: 'He\'ekia ta:tk?', prof_diag: 'Ma:cina?',
    yes: 'Hau', no: 'Pi\'a', no_doc: "Pi ha-ñiok doctor", what_diag: 'Shaču ap ma:cina?', severity: 'Ge\'e',
    mild: 'Cem', mod: 'Ge', sev: 'Ge\'e', obs_h: 'Shaču ap\nñei?', obs_s: 'A:g haicu.',
    loc: 'Hebai ap', notes: 'Haicu (cem)', any_det: 'A:g...', thanks: 'M-s-ap\'e!', rep_near: 'Haicu e-we:hejed', pima: 'Pima County',
    view_map: 'Ñei Map', rep_anon: 'A:g haicu', signup: 'O\'ohan', submit: 'Submit', continue: 'Continue',
    sym: { 'Cough':'I:ho', 'Fever':'S-ton', 'Very Tired':'S-gehge', 'Nausea':'S-ko:k e-da', 'Headache':'Mo\'o s-ko:k', 'Body Aches':'Cuhug s-ko:k', 'Sore Throat':'Ba:ñ s-ko:k', 'Other':'Haicu' },
    diag: { 'Influenza A':'Influenza A', 'Influenza B':'Influenza B', 'COVID-19':'COVID-19', 'Norovirus':'Norovirus', 'Strep Throat':'Strep Throat', 'RSV':'RSV', 'Valley Fever':'Valley Fever', 'Other':'Other' },
    ons: { 'Today':'I:da task', 'Yesterday':'Tako', 'This week':'I:da domig', 'Last week':'Vepag domig' },
    obs: { 'Dead birds nearby':'Muu cewag', 'Sick animals':'S-ko:k ha\'icu', 'Unusual mosquito activity':'Vamc s-mu\'i', 'Water issues':'Su:dagi pi-ap', 'Air quality concerns':'Hevel pi-ap', 'Nothing unusual':'Pi haicu' },
    
    dash_env: 'Jewed', dash_health: 'S-ko:k m-we:hejed', dash_alert: 'Alert', dash_forecast: 'Forecast', 
    dash_quick: 'A:g haicu', dash_impact: 'Ap s-ap', dash_recent: 'Hemaajkam a:g',
    rep_sub: 'O\'ohan', see_all: 'Ñei',
    v_temp: 'Ton', v_air: 'Hevel', v_pol: 'Pollen', v_uv: 'UV Index', v_hum: 'Humidity',
    map_stats: 'Stats', total_rep: 'Total', top_iss: 'Ge\'e'
  }
};

let listeners: Function[] = [];
let currentLang: 'EN' | 'ES' | 'TO' = 'EN';

export function useLang() {
  const [lang, setLangState] = useState<'EN' | 'ES' | 'TO'>(currentLang);

  useEffect(() => {
    getLang().then(l => {
      const parsed = (l as 'EN' | 'ES' | 'TO') || 'EN';
      currentLang = parsed;
      setLangState(parsed);
    });
    
    const listener = (newLang: 'EN' | 'ES' | 'TO') => setLangState(newLang);
    listeners.push(listener);
    return () => { listeners = listeners.filter(fn => fn !== listener); };
  }, []);

  return { lang, loc: I18N[lang] };
}

export function updateLang(newLang: 'EN' | 'ES' | 'TO') {
  currentLang = newLang;
  setStorageLang(newLang);
  listeners.forEach(fn => fn(newLang));
}
