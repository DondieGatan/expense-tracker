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

const TOKEN_KEY = 'expense_tracker_token';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = isJson && body?.error ? body.error : 'Something went wrong.';
    throw new ApiError(message, res.status);
  }
  return body;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: unknown) =>
    request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
