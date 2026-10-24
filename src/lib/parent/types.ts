import type { Group, MyAttendance } from '@/lib/api/types';

// Parents' shapes in the API (api/openapi.yaml, /v1/parent/*).

export type ParentChild = { client_id: number; first_name: string; last_name: string };

/** GET /v1/parent/child: groups are as in /v1/me. */
export type ChildView = { child: ParentChild; groups: Group[] };

/** GET /v1/parent/attendance: the table the student sees. */
export type ChildAttendance = MyAttendance;

export type ParentReport = {
  id: number;
  group_id: number | null;
  /** Empty when not about a class. */
  group_name: string;
  message: string;
  created_at: string;
  handled_at: string | null;
  /** The office's answer. */
  reply: string | null;
};
