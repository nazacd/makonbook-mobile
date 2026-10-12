import type { ErrorCode } from './types';

// Not a secret: it is the public API address. Override it for local work with
// EXPO_PUBLIC_API_URL in `.env` (e.g. http://192.168.1.10:8080).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.makonbook.uz').replace(/\/+$/, '');

const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly requestId?: string,
    /** Seconds, from Retry-After on 429s. */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Worth retrying automatically: the server or the network had a moment. */
  get transient(): boolean {
    return this.code === 'network' || this.code === 'timeout' || this.status >= 500;
  }
}

// The session token lives here so every request can use it without threading
// it through React. src/lib/auth/session.tsx is its only writer.
let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the server says the session is gone (any 401 on an authenticated call). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = authToken;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw controller.signal.aborted
      ? new ApiError(0, 'timeout', 'The server took too long to answer.')
      : new ApiError(0, 'network', 'No connection to the server.');
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const requestId = res.headers.get('X-Request-ID') ?? undefined;
  const retryAfter = Number(res.headers.get('Retry-After')) || undefined;
  let code: ErrorCode = 'unknown';
  let message = `Request failed (${res.status}).`;
  try {
    const payload = (await res.json()) as { error?: { code?: ErrorCode; message?: string } };
    if (payload.error?.code) code = payload.error.code;
    if (payload.error?.message) message = payload.error.message;
  } catch {
    // Not our JSON envelope (a proxy error page); keep the generic message.
  }

  // Only a 401 for the token that is still current ends the session; a late
  // answer to a request made before signing in again must not.
  if (res.status === 401 && token && token === authToken) {
    unauthorizedHandler?.();
  }

  throw new ApiError(res.status, code, message, requestId, retryAfter);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};
