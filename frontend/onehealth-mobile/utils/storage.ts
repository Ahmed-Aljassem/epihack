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
  // Use local dates instead of UTC
  const todayDate = new Date();
  const yesterdayDate = new Date(todayDate.getTime() - 86400000);
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
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
}

export async function saveReport(report: SavedReport): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.MY_REPORTS);
  let list: SavedReport[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse MY_REPORTS, resetting list', e);
      list = [];
    }
  }
  list.unshift(report);
  if (list.length > 50) list.length = 50;
  await AsyncStorage.setItem(KEYS.MY_REPORTS, JSON.stringify(list));
}

export async function getMyReports(): Promise<SavedReport[]> {
  const raw = await AsyncStorage.getItem(KEYS.MY_REPORTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse MY_REPORTS, returning empty array', e);
    return [];
  }
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
