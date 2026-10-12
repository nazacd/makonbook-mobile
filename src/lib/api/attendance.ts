import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { AttendanceSession, MarkState, TeacherLesson } from './types';

export const lessonsKey = (date: string) => ['teacher-lessons', date] as const;
export const sessionKey = (id: string) => ['attendance-session', id] as const;

/** A session as fetched, plus when it arrived — to correct the phone's clock. */
export type FetchedSession = AttendanceSession & { receivedAt: number };

function stamp(s: AttendanceSession): FetchedSession {
  return { ...s, receivedAt: Date.now() };
}

export function useTeacherLessons(date: string, live: boolean) {
  return useQuery({
    queryKey: lessonsKey(date),
    queryFn: () => api.get<{ date: string; lessons: TeacherLesson[] }>(`/v1/teacher/lessons?date=${date}`),
    // Today's list changes as lessons start and sessions open/finish.
    refetchInterval: live ? 60_000 : false,
  });
}

// While a session is open the teacher's screen polls it, so scans appear
// within a few seconds (spec 8.1).
export function useAttendanceSession(id: string) {
  return useQuery({
    queryKey: sessionKey(id),
    queryFn: async () => stamp(await api.get<AttendanceSession>(`/v1/attendance/sessions/${id}`)),
    refetchInterval: (query) => (query.state.data?.status === 'open' ? 3_000 : false),
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { group_id: number; date: string }) =>
      api.post<AttendanceSession>('/v1/attendance/sessions', body),
    onSuccess: (s, body) => {
      queryClient.setQueryData(sessionKey(s.id), stamp(s));
      queryClient.invalidateQueries({ queryKey: lessonsKey(body.date) });
    },
  });
}

export function useFinishSession(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AttendanceSession>(`/v1/attendance/sessions/${id}/finish`),
    onSuccess: (s) => {
      queryClient.setQueryData(sessionKey(id), stamp(s));
      queryClient.invalidateQueries({ queryKey: lessonsKey(s.date) });
    },
  });
}

export function useSetMark(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, state }: { clientId: number; state: Exclude<MarkState, 'pending'> }) =>
      api.put<AttendanceSession>(`/v1/attendance/sessions/${id}/marks/${clientId}`, { state }),
    onSuccess: (s) => queryClient.setQueryData(sessionKey(id), stamp(s)),
  });
}
