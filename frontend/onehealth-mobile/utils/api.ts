import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ──────────────────────────────────────────────────
// EpiHack Auth Service (AWS Cognito, deployed as a Lambda URL).
export const API_BASE = 'https://jimgh22yohvh6gpfilo4bcqxp40huyhw.lambda-url.us-east-2.on.aws';

// Cognito app client id for the live auth service (verified against /auth/login).
export const CLIENT_ID = '4q7cq14tk7vpr556vnnds8hrm7';

// ─── Token storage ───────────────────────────────────────────
const TK = {
  ID: 'cognito_id_token',
  ACCESS: 'cognito_access_token',
  REFRESH: 'cognito_refresh_token',
  EMAIL: 'cognito_email',
};

export interface Tokens {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

export async function getTokens(): Promise<Partial<Tokens> & { email?: string }> {
  const [[, id], [, access], [, refresh], [, email]] = await AsyncStorage.multiGet([
    TK.ID, TK.ACCESS, TK.REFRESH, TK.EMAIL,
  ]);
  return { id_token: id || undefined, access_token: access || undefined, refresh_token: refresh || undefined, email: email || undefined };
}

async function storeTokens(t: Partial<Tokens>, email?: string) {
  const pairs: [string, string][] = [];
  if (t.id_token) pairs.push([TK.ID, t.id_token]);
  if (t.access_token) pairs.push([TK.ACCESS, t.access_token]);
  if (t.refresh_token) pairs.push([TK.REFRESH, t.refresh_token]);
  if (email) pairs.push([TK.EMAIL, email]);
  if (pairs.length) await AsyncStorage.multiSet(pairs);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([TK.ID, TK.ACCESS, TK.REFRESH, TK.EMAIL]);
}

export async function isLoggedIn(): Promise<boolean> {
  const { access_token } = await getTokens();
  return !!access_token;
}

// ─── Low-level request helper ────────────────────────────────
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function detailToMessage(body: any, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.detail === 'string') return body.detail;
  if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg;
  return fallback;
}

async function request(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new ApiError(res.status, detailToMessage(body, `Request failed (${res.status})`));
  return body;
}

// ─── Public auth API ─────────────────────────────────────────
export async function register(params: {
  name: string; email: string; password: string; role?: string;
  phone_number?: string; gender?: string; address?: string; occupation?: string;
}) {
  // Drop undefined/empty optionals so we only send what we have.
  const body = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ client_id: CLIENT_ID, role: 'citizen', ...body }),
  });
}

export async function confirm(email: string, code: string) {
  return request('/auth/confirm', {
    method: 'POST',
    body: JSON.stringify({ client_id: CLIENT_ID, email, code }),
  });
}

export async function resendConfirmation(email: string) {
  return request('/auth/resend-confirmation', {
    method: 'POST',
    body: JSON.stringify({ client_id: CLIENT_ID, email }),
  });
}

export async function login(email: string, password: string): Promise<Tokens> {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ client_id: CLIENT_ID, email, password }),
  });
  await storeTokens(data, email);
  return data;
}

export async function refresh(): Promise<boolean> {
  const { refresh_token, email } = await getTokens();
  if (!refresh_token || !email) return false;
  try {
    const data = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ client_id: CLIENT_ID, refresh_token, email }),
    });
    await storeTokens(data);
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  const { access_token } = await getTokens();
  try {
    if (access_token) {
      await request(`/auth/logout-with-token?access_token=${encodeURIComponent(access_token)}`, { method: 'POST' });
    }
  } catch {
    // ignore network/expiry errors — clearing tokens locally is what matters
  } finally {
    await clearTokens();
  }
}

// Authenticated request that auto-refreshes once on 401.
async function authed(path: string, init: RequestInit, tokenKind: 'id' | 'access' = 'access', retry = true): Promise<any> {
  const tokens = await getTokens();
  const token = tokenKind === 'id' ? tokens.id_token : tokens.access_token;
  try {
    return await request(path, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
  } catch (e) {
    if (retry && e instanceof ApiError && e.status === 401 && (await refresh())) {
      return authed(path, init, tokenKind, false);
    }
    throw e;
  }
}

export async function getMe() {
  return authed('/auth/me', { method: 'GET' }, 'id');
}

export async function getUser() {
  return authed('/auth/user', { method: 'GET' }, 'access');
}

// Profile attributes. Maps to UserAttributesRequest on the backend.
// `gender`, `address`, `occupation`, `age` are the newer fields — the backend
// team must add them to /auth/user-attributes for them to persist server-side.
// `address` carries geo as "<lat>, <lng>".
export interface UserAttributes {
  name?: string;
  email?: string;
  role?: string;
  gender?: string;          // "male" | "female"
  address?: string;         // "<lat>, <lng>"
  occupation?: string;
  age?: string;
  sex?: string;             // legacy field name (kept for back-compat)
  birthday?: string;
  language?: string;
  num_household_members?: number;
  home_zips?: string;
  pets?: string;
  backyard_water_flag?: boolean;
  works_flag?: boolean;
  goes_to_school_flag?: boolean;
  outdoor_worker_flag?: boolean;
  phone_number?: string;
}

export async function updateUserAttributes(attrs: UserAttributes) {
  // Drop undefined keys so we only send what changed.
  const body = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined && v !== ''));
  return authed('/auth/user-attributes', { method: 'POST', body: JSON.stringify(body) }, 'access');
}
