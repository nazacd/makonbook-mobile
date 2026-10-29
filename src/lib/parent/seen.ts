import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ParentReport } from './types';
import type { SavedChild } from './session';

// Which of the office's answers the parent has seen, per child, on this phone:
// an answer not seen yet puts a dot on the home screen's report row.

const key = (kid: SavedChild) => `@makonbook/parent/${kid.client_id}/seen-answers`;
const queryKey = (kid: SavedChild | undefined) => ['parent', kid?.client_id, 'seen-answers'] as const;

async function load(kid: SavedChild): Promise<number[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(key(kid))) ?? '[]') as number[];
  } catch {
    return [];
  }
}

/** The reports with an answer the parent hasn't seen yet. */
export function useUnseenAnswers(kid: SavedChild | undefined, reports: ParentReport[] | undefined) {
  const seen = useQuery({ queryKey: queryKey(kid), queryFn: () => load(kid!), enabled: !!kid, staleTime: Infinity });
  if (!seen.data || !reports) return [];
  return reports.filter((r) => r.reply && !seen.data.includes(r.id));
}

/** Records every answered report as seen (opening the reports screen). */
export function useMarkAnswersSeen(kid: SavedChild | undefined) {
  const queryClient = useQueryClient();
  return (reports: ParentReport[]) => {
    if (!kid) return;
    const ids = reports.filter((r) => r.reply).map((r) => r.id);
    queryClient.setQueryData(queryKey(kid), ids);
    AsyncStorage.setItem(key(kid), JSON.stringify(ids)).catch(() => {});
  };
}
