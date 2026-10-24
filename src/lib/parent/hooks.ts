import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useParent, type SavedChild } from './session';
import type { ChildAttendance, ChildView, ParentReport } from './types';

// Server state of one child, as their parent sees it. Keys start with
// ['parent', client_id], so removing a child drops all of it.

export function useChildView(kid: SavedChild | undefined) {
  const { call } = useParent();
  return useQuery({
    queryKey: ['parent', kid?.client_id, 'child'],
    queryFn: () => call<ChildView>(kid!, 'GET', '/v1/parent/child'),
    enabled: !!kid,
  });
}

export function useChildAttendance(kid: SavedChild | undefined) {
  const { call } = useParent();
  return useQuery({
    queryKey: ['parent', kid?.client_id, 'attendance'],
    queryFn: () => call<ChildAttendance>(kid!, 'GET', '/v1/parent/attendance'),
    enabled: !!kid,
  });
}

export function useChildReports(kid: SavedChild | undefined) {
  const { call } = useParent();
  return useQuery({
    queryKey: ['parent', kid?.client_id, 'reports'],
    queryFn: () => call<{ reports: ParentReport[] }>(kid!, 'GET', '/v1/parent/reports'),
    enabled: !!kid,
  });
}

export function useSendReport(kid: SavedChild | undefined) {
  const { call, lang } = useParent();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { message: string; group_id: number | null }) =>
      call<ParentReport>(kid!, 'POST', '/v1/parent/reports', { ...body, lang }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parent', kid?.client_id, 'reports'] }),
  });
}
