import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const SESSION_KEY = 'carRental.session.v2';

const expoApiUrl = Constants.expoConfig?.extra?.apiUrl || Constants.manifest?.extra?.apiUrl;

function normalizeApiBase(rawBase)  {
  const trimmed = rawBase.trim().replace(/\/$/, '');
  const withProtocol = trimmed.match(/^[a-zA-Z][a-zA-Z\d+-.]*:\/\//)
    ? trimmed
    : `http://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (['0.0.0.0', '127.0.0.1', 'localhost'].includes(url.hostname)) {
      if (Platform.OS === 'android') {
        url.hostname = '10.0.2.2';
      } else if (Platform.OS === 'ios') {
        url.hostname = '127.0.0.1';
      }
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return withProtocol;
  }
}

function getDefaultApiBase() {
  const expoPackagerHost = getExpoPackagerHost();
  if (expoPackagerHost) {
    return normalizeApiBase(`${expoPackagerHost}:8000`);
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:8000';
  }

  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return 'http://127.0.0.1:8000';
  }

  return 'http://localhost:8000';
}

function getExpoPackagerHost() {
  const manifest = Constants.manifest || Constants.expoConfig;
  const rawHost = manifest?.debuggerHost || manifest?.packagerOpts?.hostUri || manifest?.hostUri;
  if (!rawHost || typeof rawHost !== 'string') return null;
  const [host] = rawHost.split(':');
  if (!host || ['localhost', '127.0.0.1', '0.0.0.0'].includes(host)) return null;
  return host;
}

const expoPackagerHost = getExpoPackagerHost();
const expoHostBase = expoPackagerHost ? normalizeApiBase(`${expoPackagerHost}:8000`) : null;
const apiSource = process.env.EXPO_PUBLIC_API_URL || expoApiUrl || getDefaultApiBase();
const API_BASE = normalizeApiBase(apiSource);

// Debug logging
console.log('[API Config] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('[API Config] expoApiUrl:', expoApiUrl);
console.log('[API Config] expoPackagerHost:', expoPackagerHost);
console.log('[API Config] expoHostBase:', expoHostBase);
console.log('[API Config] apiSource:', apiSource);
console.log('[API Config] API_BASE:', API_BASE);

function toErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  
  try {
    const extract = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) {
        const strings = val.map(extract).filter(Boolean);
        return strings.length > 0 ? strings.join(', ') : null;
      }
      if (typeof val === 'object') {
        // Handle FastAPI / Pydantic validation errors format
        if (val.loc && val.msg) {
          const field = Array.isArray(val.loc) ? val.loc[val.loc.length - 1] : val.loc;
          return `${field}: ${val.msg}`;
        }
        if (val.detail) return extract(val.detail);
        if (val.message) return extract(val.message);
        if (val.msg) return extract(val.msg);
        if (val.error) return extract(val.error);
        if (val.non_field_errors) return extract(val.non_field_errors);
        const keys = Object.keys(val);
        for (const k of keys) {
          const v = val[k];
          if (Array.isArray(v)) {
            const fieldErrors = v.map(e => {
              if (typeof e === 'string') return `${k}: ${e}`;
              if (e && typeof e === 'object' && e[0] && e[1]) return `${k}: ${e[0]} - ${e[1]}`;
              return extract(e);
            }).filter(Boolean);
            if (fieldErrors.length) return fieldErrors.join('; ');
          }
        }
        if (keys.length > 0) return extract(val[keys[0]]);
      }
      return String(val);
    };
    
    const result = extract(payload);
    return (result && typeof result === 'string') ? result : JSON.stringify(payload);
  } catch (e) {
    return fallback;
  }
}

export async function apiRequest(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const url = `${API_BASE}${path}`;

  // Attach auth header from stored session if available
  let authHeader = {};
  try {
    const sessRaw = await AsyncStorage.getItem(SESSION_KEY);
    if (sessRaw) {
      const sess = JSON.parse(sessRaw);
      const token = sess?.token || sess?.access || sess?.authToken || sess?.key || sess?.jwt || sess?.accessToken || sess?.access_token || sess?.authorization || null;
      if (token) {
        // Some backends expect 'Token <key>' while others expect 'Bearer <jwt>'.
        const headerValue = String(token).startsWith('Token ') || String(token).startsWith('Bearer ')
          ? String(token)
          : `Bearer ${String(token)}`;
        authHeader = { Authorization: headerValue };
      }
    }
  } catch (e) {
    // ignore session read errors — proceed without auth
  }

  const isFormData = body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

  let response;
  try {
    response = await fetch(url, {
      credentials: 'omit',
      ...rest,
      headers: {
        ...defaultHeaders,
        ...authHeader,
        ...headers,
      },
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (networkError) {
    const message = networkError?.message || String(networkError);
    const details = `Network request failed calling ${url}: ${message}`;
    console.warn('[apiRequest] network error', details);

    if (Platform.OS === 'android' && expoHostBase && expoHostBase !== API_BASE) {
      const fallbackUrl = `${expoHostBase}${path}`;
      console.warn('[apiRequest] retrying against expo packager host', fallbackUrl);
      try {
        response = await fetch(fallbackUrl, {
          credentials: 'omit',
          ...rest,
          headers: {
            ...defaultHeaders,
            ...authHeader,
            ...headers,
          },
          body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        });
      } catch (fallbackError) {
        const fallbackMessage = fallbackError?.message || String(fallbackError);
        const fallbackDetails = `Fallback network request failed calling ${fallbackUrl}: ${fallbackMessage}`;
        console.warn('[apiRequest] fallback network error', fallbackDetails);
        throw new Error(`${details} | ${fallbackDetails}`);
      }
    } else {
      throw new Error(details);
    }
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.warn('[apiRequest] unauthorized, clearing session and redirecting to login');
      await AsyncStorage.removeItem(SESSION_KEY);
      router.replace('/login');
    }
    // Log full response for server (5xx) errors to aid debugging
    if (response.status >= 500) {
      console.warn('[apiRequest] server error', { url, status: response.status, statusText: response.statusText, bodyText: text, parsed: payload });
    } else {
      console.warn('[apiRequest] client error', { url, status: response.status, body: payload });
    }
    throw new Error(toErrorMessage(payload, `Request failed: ${response.status}`));
  }

  return payload;
}
