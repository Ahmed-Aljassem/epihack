import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ────────────────────────────────────────────────────
const KEYS = {
  FIRST_REPORT: 'hasCompletedFirstReport',
  ZIP: 'userZip',
  LANG: 'userLang',
  THEME: 'userTheme',
  AUTH_TOKEN: 'authToken',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  REPORT_COUNT: 'reportCount',
  LAST_REPORT_DATE: 'lastReportDate',
  STREAK: 'reportStreak',
  MY_REPORTS: 'myReports',
  NOTIFS_ON: 'notifsOn',
  COMMUNITY_DISMISSED: 'communityDisclaimerDismissed',
  PROFILE: 'localProfile',
};

// ─── Local profile (mirrors what we collect; some fields aren't in Cognito yet) ─
export interface LocalProfile {
  name?: string;
  email?: string;
  age?: string;
  sex?: string;
  occupation?: string;
  phone?: string;
  household?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

export async function getLocalProfile(): Promise<LocalProfile> {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : {};
}

export async function setLocalProfile(patch: LocalProfile): Promise<LocalProfile> {
  const current = await getLocalProfile();
  const merged = { ...current, ...patch };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(merged));
  return merged;
}

export async function clearLocalProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.PROFILE);
}

// ─── Helpers ─────────────────────────────────────────────────
export async function hasCompletedFirstReport(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.FIRST_REPORT);
  return v === 'true';
}

export async function setFirstReportComplete(): Promise<void> {
  await AsyncStorage.setItem(KEYS.FIRST_REPORT, 'true');
}

export async function getUserZip(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.ZIP)) || '85719';
}

export async function setUserZip(zip: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ZIP, zip);
}

export async function getLang(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.LANG)) || 'EN';
}

export async function setLang(lang: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANG, lang);
}

export async function getThemeMode(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.THEME)) || 'light';
}

export async function setThemeMode(mode: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, mode);
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.AUTH_TOKEN);
}

export async function setAuth(token: string, name: string, email: string): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.AUTH_TOKEN, token],
    [KEYS.USER_NAME, name],
    [KEYS.USER_EMAIL, email],
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.USER_NAME, KEYS.USER_EMAIL]);
}

export async function getUserProfile(): Promise<{ name: string | null; email: string | null; token: string | null }> {
  const [[, token], [, name], [, email]] = await AsyncStorage.multiGet([KEYS.AUTH_TOKEN, KEYS.USER_NAME, KEYS.USER_EMAIL]);
  return { token, name, email };
}

export async function getReportStats(): Promise<{ count: number; streak: number }> {
  const count = parseInt((await AsyncStorage.getItem(KEYS.REPORT_COUNT)) || '0', 10);
  const streak = parseInt((await AsyncStorage.getItem(KEYS.STREAK)) || '0', 10);
  return { count, streak };
}

export async function incrementReportCount(): Promise<void> {
  const count = parseInt((await AsyncStorage.getItem(KEYS.REPORT_COUNT)) || '0', 10);
  const lastDate = await AsyncStorage.getItem(KEYS.LAST_REPORT_DATE);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streak = parseInt((await AsyncStorage.getItem(KEYS.STREAK)) || '0', 10);

  if (lastDate === today) {
    // Already reported today, just increment count
  } else if (lastDate === yesterday || !lastDate) {
    streak += 1;
  } else {
    streak = 1;
  }

  await AsyncStorage.multiSet([
    [KEYS.REPORT_COUNT, String(count + 1)],
    [KEYS.LAST_REPORT_DATE, today],
    [KEYS.STREAK, String(streak)],
  ]);
}

export interface SavedReport {
  id: string;
  feeling: string;
  category: string[];
  symptoms?: string[];
  observations?: string[];
  severity?: string;
  zip: string;
  date: string;
  submittedAt?: string;
  reportSubject?: string;
  otherSymptomText?: string;
  sickCount?: number;
  onset?: string;
  diagnosed?: boolean | null;
  absentFromWorkSchool?: boolean | null;
  animalTypes?: string[];
  animalObservations?: string[];
  animalIncidentDate?: string;
  animalSpecies?: string;
  animalAffectedCount?: number;
  animalOtherIncidentDetails?: string;
  animalNotes?: string;
  environmentObservations?: string[];
  environmentIncidentDate?: string;
  environmentVectorDensity?: string;
  environmentNotes?: string;
}

export async function saveReport(report: SavedReport): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.MY_REPORTS);
  const list = normalizeSavedReports(raw ? JSON.parse(raw) : []);
  list.unshift(normalizeSavedReport(report));
  if (list.length > 50) list.length = 50;
  await AsyncStorage.setItem(KEYS.MY_REPORTS, JSON.stringify(list));
}

export async function getMyReports(): Promise<SavedReport[]> {
  const raw = await AsyncStorage.getItem(KEYS.MY_REPORTS);
  return normalizeSavedReports(raw ? JSON.parse(raw) : []);
}

export async function isDisclaimerDismissed(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.COMMUNITY_DISMISSED)) === 'true';
}

export async function dismissDisclaimer(): Promise<void> {
  await AsyncStorage.setItem(KEYS.COMMUNITY_DISMISSED, 'true');
}

export async function getNotifsOn(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.NOTIFS_ON);
  return v !== 'false';
}

export async function setNotifsOn(on: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIFS_ON, String(on));
}

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return items.length > 0 ? items : undefined;
};

const toOptionalString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim().length > 0 ? value : undefined
);

const normalizeSavedReport = (value: unknown): SavedReport => {
  const raw = (value && typeof value === 'object') ? value as Record<string, unknown> : {};
  const categoryValue = raw.category;
  const category = Array.isArray(categoryValue)
    ? categoryValue.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : typeof categoryValue === 'string' && categoryValue.trim().length > 0
      ? [categoryValue]
      : [];

  const date = toOptionalString(raw.date) || toOptionalString(raw.submittedAt) || new Date().toISOString();

  return {
    id: toOptionalString(raw.id) || `${Date.now()}`,
    feeling: toOptionalString(raw.feeling) || 'report',
    category,
    symptoms: toStringArray(raw.symptoms),
    observations: toStringArray(raw.observations),
    severity: toOptionalString(raw.severity),
    zip: toOptionalString(raw.zip) || '',
    date,
    submittedAt: toOptionalString(raw.submittedAt),
    reportSubject: toOptionalString(raw.reportSubject),
    otherSymptomText: toOptionalString(raw.otherSymptomText),
    sickCount: typeof raw.sickCount === 'number' ? raw.sickCount : undefined,
    onset: toOptionalString(raw.onset),
    diagnosed: typeof raw.diagnosed === 'boolean' ? raw.diagnosed : null,
    absentFromWorkSchool: typeof raw.absentFromWorkSchool === 'boolean' ? raw.absentFromWorkSchool : null,
    animalTypes: toStringArray(raw.animalTypes),
    animalObservations: toStringArray(raw.animalObservations),
    animalIncidentDate: toOptionalString(raw.animalIncidentDate),
    animalSpecies: toOptionalString(raw.animalSpecies),
    animalAffectedCount: typeof raw.animalAffectedCount === 'number' ? raw.animalAffectedCount : undefined,
    animalOtherIncidentDetails: toOptionalString(raw.animalOtherIncidentDetails),
    animalNotes: toOptionalString(raw.animalNotes),
    environmentObservations: toStringArray(raw.environmentObservations),
    environmentIncidentDate: toOptionalString(raw.environmentIncidentDate),
    environmentVectorDensity: toOptionalString(raw.environmentVectorDensity),
    environmentNotes: toOptionalString(raw.environmentNotes),
  };
};

const normalizeSavedReports = (value: unknown): SavedReport[] => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeSavedReport);
};
