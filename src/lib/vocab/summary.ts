import { useQueries } from '@tanstack/react-query';

import { fetchGroupVocab, groupVocabKey } from './hooks';

// The teacher's Words tab at a glance: per group, how many students studied
// words this week. The screens only use useVocabSummary; today it asks for
// each group's progress (in parallel, each row filling in as its answer
// arrives), and a summary endpoint can replace that here without touching
// the UI.

const KEEP_MS = 5 * 60_000;

export type GroupVocabSummary = { students: number; studied: number };

/** Each group's summary as it arrives; a group whose request failed has none. */
export function useVocabSummary(groupIds: number[]) {
  const queries = useQueries({
    queries: groupIds.map((id) => ({ queryKey: groupVocabKey(String(id)), queryFn: () => fetchGroupVocab(String(id)), staleTime: KEEP_MS })),
  });
  const groups: Record<number, GroupVocabSummary | undefined> = {};
  groupIds.forEach((id, i) => {
    const data = queries[i]?.data;
    if (data) groups[id] = { students: data.students.length, studied: data.students.filter((s) => s.reviews_week > 0).length };
  });
  return { groups, refetch: () => Promise.all(queries.map((q) => q.refetch())) };
}
