import { focusManager, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

import { ApiError, api } from './client';
import type { AppConfig, Profile } from './types';

export const meQueryKey = ['me'] as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry only what a retry can fix; a 4xx will answer the same again.
        retry: (count, error) => count < 2 && error instanceof ApiError && error.transient,
        staleTime: 60_000,
      },
      mutations: { retry: false },
    },
  });
}

// React Query's "refetch on focus" means "app came back to the foreground" on
// a phone.
export function connectFocusManager() {
  if (Platform.OS === 'web') return () => {};
  const sub = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
  return () => sub.remove();
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: () => api.get<Profile>('/v1/me'),
    enabled,
    // Offline, try again every half minute, so the app notices the connection
    // coming back while it's open.
    refetchInterval: (query) => (query.state.error instanceof ApiError && query.state.error.transient ? 30_000 : false),
  });
}

/** A student's parent code, for their parents (GET /v1/me/parent-code). */
export function useParentCode(enabled: boolean) {
  return useQuery({
    queryKey: ['me', 'parent-code'],
    queryFn: () => api.get<{ code: string }>('/v1/me/parent-code'),
    enabled,
    staleTime: Infinity, // it never changes
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { current_password: string; new_password: string }) =>
      api.post<void>('/v1/auth/password', body),
    onSuccess: () => {
      queryClient.setQueryData<Profile>(meQueryKey, (me) => me && { ...me, must_change_password: false });
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}

export function useSetUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => api.put<{ username: string }>('/v1/auth/username', { username }),
    onSuccess: ({ username }) => {
      queryClient.setQueryData<Profile>(meQueryKey, (me) => me && { ...me, username });
    },
  });
}

/** This build's version, e.g. "1.0.0". */
export const appVersion = Constants.expoConfig?.version ?? '0.0.0';

// Compares dotted versions numerically: 1.10.0 is newer than 1.9.2.
export function isOlder(version: string, than: string): boolean {
  const a = version.split('.').map(Number);
  const b = than.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x < y;
  }
  return false;
}

// Asked once per launch. Offline, or with the API down, the app carries on:
// the Level Check works without a network, and a forced update can wait for
// the next launch with a connection.
export function useUpdateRequired(): boolean {
  const { data } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => api.get<AppConfig>('/v1/app/config'),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  if (!data || (Platform.OS !== 'android' && Platform.OS !== 'ios')) return false;
  return isOlder(appVersion, data.min_app_version[Platform.OS]);
}
