import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from '@/lib/api/client';
import type { LoginResponse } from '@/lib/api/types';
import { meQueryKey } from '@/lib/api/queries';
import { getDeviceId } from './device';
import { deleteItem, getItem, setItem } from './secure-storage';

const TOKEN_KEY = 'makonbook.session_token';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Who is signed in, as far as this device knows. The token is read from secure
// storage once at launch; everything about the person comes from /v1/me
// (useMe), so it is never stale for longer than a refetch.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    getItem(TOKEN_KEY)
      .catch(() => null)
      .then((token) => {
        if (cancelled) return;
        setAuthToken(token);
        setStatus(token ? 'signedIn' : 'signedOut');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Forget the session on this device. Never fails: a broken keychain must not
  // leave someone stuck signed in.
  async function forget() {
    setAuthToken(null);
    await deleteItem(TOKEN_KEY).catch(() => {});
    queryClient.clear();
    setStatus('signedOut');
  }

  useEffect(() => {
    setUnauthorizedHandler(() => void forget());
    return () => setUnauthorizedHandler(null);
  });

  async function signIn(login: string, password: string) {
    const response = await api.post<LoginResponse>('/v1/auth/login', {
      login: login.trim(),
      password,
      device_id: await getDeviceId(),
    });
    await setItem(TOKEN_KEY, response.token);
    setAuthToken(response.token);
    queryClient.setQueryData(meQueryKey, response.user);
    setStatus('signedIn');
  }

  async function signOut() {
    // Tell the server, but don't make the person wait on it or fail because
    // of it: the token is deleted here either way.
    api.post('/v1/auth/logout').catch(() => {});
    await forget();
  }

  return <AuthContext value={{ status, signIn, signOut }}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
