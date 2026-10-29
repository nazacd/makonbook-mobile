import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { ApiError, api } from '@/lib/api/client';
import { useMe } from '@/lib/api/queries';

import { readPackage, removePackages, storeDownload } from './files';
import {
  clearRun,
  forgetDownload,
  loadAttempts,
  loadDownloads,
  loadRun,
  loadRuns,
  markRejected,
  markUploaded,
  mergeFromServer,
  saveDownload,
  saveRun,
  type Person,
  type Run,
} from './local';
import type { CatalogTest, GroupStudent, OwnAttempt, Package, ServerAttempt } from './types';

/** Whose practice this phone shows: the signed-in person. */
export function usePerson(): Person {
  const me = useMe().data;
  return me ? `${me.kind}-${me.id}` : 'nobody';
}

// What is on the phone lives in React Query too, under ['practice-local', …],
// so screens update when it changes (invalidate after a write).
const localKey = (person: Person, ...rest: string[]) => ['practice-local', person, ...rest] as const;

export function useCatalog() {
  return useQuery({
    queryKey: ['practice-catalog'],
    queryFn: async () => (await api.get<{ tests: CatalogTest[] }>('/v1/practice/tests')).tests,
  });
}

export function useDownloads() {
  const person = usePerson();
  return useQuery({ queryKey: localKey(person, 'downloads'), queryFn: () => loadDownloads(person), staleTime: Infinity });
}

export function useRuns() {
  const person = usePerson();
  return useQuery({ queryKey: localKey(person, 'runs'), queryFn: () => loadRuns(person), staleTime: Infinity });
}

export function useRun(code: string) {
  const person = usePerson();
  return useQuery({ queryKey: localKey(person, 'runs', code), queryFn: () => loadRun(person, code), staleTime: Infinity });
}

export function useLocalAttempts() {
  const person = usePerson();
  return useQuery({ queryKey: localKey(person, 'attempts'), queryFn: () => loadAttempts(person), staleTime: Infinity });
}

export function usePackage(code: string, version: number | undefined) {
  return useQuery({
    queryKey: ['practice-package', code, version],
    queryFn: () => readPackage(code, version!),
    enabled: version != null,
    staleTime: Infinity,
  });
}

/**
 * Saves or removes the test in progress: on the phone, and at once in what the
 * screens show (they read it through React Query, which would otherwise keep
 * showing the version from before the write until the app restarts).
 */
export function useRunStore() {
  const person = usePerson();
  const queryClient = useQueryClient();
  return useMemo(() => {
    const put = (code: string, run: Run | null) => {
      queryClient.setQueryData(localKey(person, 'runs', code), run);
      queryClient.setQueryData<Record<string, Run>>(localKey(person, 'runs'), (all) => {
        const next = { ...all };
        if (run) next[code] = run;
        else delete next[code];
        return next;
      });
    };
    return {
      save: (run: Run) => {
        put(run.code, run);
        return saveRun(person, run);
      },
      clear: (code: string) => {
        put(code, null);
        return clearRun(person, code);
      },
    };
  }, [person, queryClient]);
}

/** Re-reads what is on the phone after a write. */
export function useRefreshLocal() {
  const queryClient = useQueryClient();
  const person = usePerson();
  return () => queryClient.invalidateQueries({ queryKey: localKey(person) });
}

/** Downloads a test's latest version, with progress (images done of total). */
export function useDownloadTest() {
  const person = usePerson();
  const refresh = useRefreshLocal();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const mutation = useMutation({
    mutationFn: async (code: string) => {
      setProgress({ done: 0, total: 0 });
      const res = await api.get<{ package: Package; images: Record<string, string> }>(
        `/v1/practice/tests/${encodeURIComponent(code)}/package`,
      );
      const pkg = res.package;
      await storeDownload(pkg, res.images, (done, total) => setProgress({ done, total }));
      const bytes = Object.values(pkg.images).reduce((sum, i) => sum + i.bytes, 0);
      await saveDownload(person, { code, title: pkg.title, version: pkg.version, bytes, at: new Date().toISOString() });
      return pkg;
    },
    onSettled: () => {
      setProgress(null);
      refresh();
    },
  });
  return { ...mutation, progress };
}

export function useRemoveDownload() {
  const person = usePerson();
  const refresh = useRefreshLocal();
  return useMutation({
    mutationFn: async (code: string) => {
      await forgetDownload(person, code);
      removePackages(code);
    },
    onSettled: refresh,
  });
}

/**
 * Sends finished attempts the server doesn't have yet, then brings the phone's
 * list in line with the server's (another phone's attempts, from before a
 * reinstall, or changed there). Runs when the Practice screens are shown and whenever the app
 * comes back to the foreground; a refused attempt (it can't become valid) is
 * kept but not sent again.
 */
export function useUploadAttempts(enabled: boolean) {
  const person = usePerson();
  const refresh = useRefreshLocal();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['practice-upload', person],
    enabled,
    queryFn: async () => {
      const pending = (await loadAttempts(person)).filter((a) => !a.uploaded && !a.rejected);
      let sent = 0;
      let online = true;
      for (const a of pending) {
        try {
          const server = await api.post<ServerAttempt>('/v1/practice/attempts', {
            id: a.id,
            test: a.code,
            version: a.version,
            sections: a.sections,
            started_at: a.started_at,
            finished_at: a.finished_at,
            answers: a.answers,
          });
          await markUploaded(person, server);
          sent++;
        } catch (e) {
          if (e instanceof ApiError && (e.code === 'invalid_attempt' || e.code === 'attempt_id_taken')) {
            await markRejected(person, a.id, e.message);
          } else {
            online = false; // offline or the server is down: try again later
            break;
          }
        }
      }
      let added = 0;
      if (online) {
        try {
          const { attempts } = await api.get<{ attempts: OwnAttempt[] }>('/v1/me/practice/attempts');
          added = await mergeFromServer(person, attempts);
          queryClient.setQueryData(['practice-mine'], attempts);
        } catch {
          // Offline: the phone's own attempts still show.
        }
      }
      if (sent > 0 || pending.length > 0 || added > 0) {
        refresh();
        queryClient.invalidateQueries({ queryKey: ['practice-mine'] });
      }
      return pending.length - sent;
    },
  });
}

/** The student's attempts as the server has them (from any phone). */
export function useServerAttempts(enabled: boolean) {
  return useQuery({
    queryKey: ['practice-mine'],
    enabled,
    queryFn: async () => (await api.get<{ attempts: ServerAttempt[] }>('/v1/me/practice/attempts')).attempts,
  });
}

export const groupPracticeKey = (groupId: string) => ['practice-group', groupId] as const;

export async function fetchGroupPractice(groupId: string) {
  return (await api.get<{ students: GroupStudent[] }>(`/v1/teacher/groups/${encodeURIComponent(groupId)}/practice`)).students;
}

export function useGroupPractice(groupId: string) {
  return useQuery({ queryKey: groupPracticeKey(groupId), queryFn: () => fetchGroupPractice(groupId) });
}
