import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchGroupPractice, groupPracticeKey, usePerson } from './hooks';
import { loadLastVisit, saveLastVisit } from './local';
import type { GroupStudent, ServerAttempt } from './types';

// The teacher's Practice tab at a glance: per group, how many students have
// practised and which results came in since the teacher last looked.
//
// The screens only use usePracticeSummary. Today it asks for each group's
// results (in parallel, each row filling in as its answer arrives); a single
// summary endpoint can replace the requests here without touching the UI.

const KEEP_MS = 5 * 60_000;

export type FreshResult = {
  groupId: number;
  student: Pick<GroupStudent, 'client_id' | 'first_name' | 'last_name'>;
  attempt: ServerAttempt;
  /** The student's previous full-test score, for the change; null for a section or a first full test. */
  previousTotal: number | null;
};

export type GroupSummary = { students: number; practiced: number; fresh: FreshResult[] };

function summarize(groupId: number, students: GroupStudent[], since: number | null): GroupSummary {
  const fresh: FreshResult[] = [];
  for (const s of students) {
    // Attempts come newest first.
    s.attempts.forEach((attempt, i) => {
      if (since == null || Date.parse(attempt.finished_at) <= since) return;
      const previous = attempt.total == null ? undefined : s.attempts.slice(i + 1).find((a) => a.total != null);
      fresh.push({
        groupId,
        student: { client_id: s.client_id, first_name: s.first_name, last_name: s.last_name },
        attempt,
        previousTotal: previous?.total ?? null,
      });
    });
  }
  return { students: students.length, practiced: students.filter((s) => s.attempts.length > 0).length, fresh };
}

/**
 * Each group's summary as it arrives (a group whose request failed has none),
 * and every result newer than `since`, newest first. `since` null (no visit
 * recorded yet) means nothing counts as new.
 */
export function usePracticeSummary(groupIds: number[], since: number | null) {
  const queries = useQueries({
    queries: groupIds.map((id) => ({
      queryKey: groupPracticeKey(String(id)),
      queryFn: () => fetchGroupPractice(String(id)),
      staleTime: KEEP_MS,
    })),
  });
  const groups: Record<number, GroupSummary | undefined> = {};
  groupIds.forEach((id, i) => {
    const students = queries[i]?.data;
    if (students) groups[id] = summarize(id, students, since);
  });
  const fresh = Object.values(groups)
    .flatMap((g) => g?.fresh ?? [])
    .sort((a, b) => b.attempt.finished_at.localeCompare(a.attempt.finished_at));
  return { groups, fresh, refetch: () => Promise.all(queries.map((q) => q.refetch())) };
}

// Not under ['practice-local', …]: refreshing what's on the phone re-reads
// those from storage and could race a visit that is still being written.
const lastVisitKey = (person: string) => ['teacher-last-visit', person] as const;

/** The teacher's last visit to the Practice tab on this phone, as epoch ms; null before the first. */
export function useLastVisit(): number | null {
  const person = usePerson();
  const query = useQuery({ queryKey: lastVisitKey(person), queryFn: () => loadLastVisit(person), staleTime: Infinity });
  return query.data ? Date.parse(query.data) : null;
}

/** Records leaving the Practice tab now: what came in until then has been seen. */
export function useMarkVisited() {
  const person = usePerson();
  const queryClient = useQueryClient();
  return () => {
    const at = new Date().toISOString();
    queryClient.setQueryData(lastVisitKey(person), at);
    saveLastVisit(person, at).catch(() => {});
  };
}
