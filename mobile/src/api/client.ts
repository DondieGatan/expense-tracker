import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 5100;

function resolveApiBase(): string {
  // Explicit override always wins (e.g. pointing at a deployed backend).
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override;

  // On web, the browser and the API share the same machine.
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}/api`;

  // The Android emulator has a standard alias (10.0.2.2) that always maps
  // to the host machine's localhost — more reliable than LAN-IP detection
  // for emulator networking specifically. A physical Android device can't
  // reach 10.0.2.2, but for those, set EXPO_PUBLIC_API_URL explicitly.
  if (Platform.OS === 'android' && __DEV__) return `http://10.0.2.2:${API_PORT}/api`;

  // On a physical device / simulator (Expo Go), "localhost" refers to the
  // device itself, not the dev machine — derive the dev machine's LAN IP
  // from the Metro bundler's own host address instead.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const lanHost = hostUri?.split(':')?.[0];
  if (lanHost) return `http://${lanHost}:${API_PORT}/api`;

  return `http://localhost:${API_PORT}/api`;
}

export const API_BASE = resolveApiBase();

const ACCESS_TOKEN_KEY = 'expense_tracker_access_token';
const REFRESH_TOKEN_KEY = 'expense_tracker_refresh_token';

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
    return;
  }
  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}

export async function setTokens(accessToken: string | null, refreshToken: string | null) {
  await Promise.all([storageSet(ACCESS_TOKEN_KEY, accessToken), storageSet(REFRESH_TOKEN_KEY, refreshToken)]);
}

export async function getAccessToken() {
  return storageGet(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return storageGet(REFRESH_TOKEN_KEY);
}

// Called when a refresh attempt fails (refresh token invalid/expired/revoked) —
// AuthContext registers this to drop back to the login screen.
let onSessionExpired: (() => void) | null = null;
export function registerSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

// Called while retrying a request that looks like it hit a sleeping free-tier
// backend (Render spins down after 15 min idle and takes ~30-50s to wake up).
// AuthContext exposes this as `retryStatus` so screens can show a friendly
// message instead of a bare "Something went wrong."
let onRetryStatus: ((message: string | null) => void) | null = null;
export function registerRetryStatusHandler(handler: (message: string | null) => void) {
  onRetryStatus = handler;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await storageGet(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        if (!res.ok) return null;
        const data = await res.json();
        await storageSet(ACCESS_TOKEN_KEY, data.accessToken);
        return data.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function rawRequest(path: string, options: RequestInit, token: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// Retry delays add up to ~41s, covering Render's typical cold-start window.
const COLD_START_RETRY_DELAYS_MS = [3000, 6000, 12000, 20000];

async function fetchWithColdStartRetry(path: string, options: RequestInit, token: string | null) {
  for (let attempt = 0; ; attempt++) {
    const isLastAttempt = attempt === COLD_START_RETRY_DELAYS_MS.length;
    try {
      const res = await rawRequest(path, options, token);
      const contentType = res.headers.get('content-type') || '';
      const looksLikeSleepingBackend = !res.ok && !contentType.includes('application/json');
      if (!looksLikeSleepingBackend || isLastAttempt) {
        onRetryStatus?.(null);
        return res;
      }
    } catch (e) {
      if (isLastAttempt) {
        onRetryStatus?.(null);
        throw e;
      }
    }
    onRetryStatus?.('Waking up the server — this can take up to a minute on first use.');
    await new Promise((resolve) => setTimeout(resolve, COLD_START_RETRY_DELAYS_MS[attempt]));
  }
}

async function parseResponse(res: Response) {
  if (res.status === 204) return null;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = isJson && body?.error ? body.error : 'Something went wrong.';
    throw new ApiError(message, res.status);
  }
  return body;
}

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

async function request(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  let res = await fetchWithColdStartRetry(path, options, token);

  if (res.status === 401 && !AUTH_ENDPOINTS.includes(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawRequest(path, options, newToken);
    } else {
      await setTokens(null, null);
      onSessionExpired?.();
    }
  }

  return parseResponse(res);
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: unknown) =>
    request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
