// Request and response shapes of the MakonBook API. The contract is
// api/openapi.yaml in the makonbook-api repo; keep these in step with it.

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Slot = {
  weekdays: Weekday[];
  /** "HH:MM", school time zone. */
  begin_time: string;
  end_time: string;
  classroom: string;
  /** "YYYY-MM-DD"; absent when open-ended. */
  begin_date?: string;
  end_date?: string;
  teachers: string[];
};

export type Group = {
  id: number;
  name: string;
  discipline: string;
  learning_type: string;
  office: string;
  schedule: Slot[];
};

export type Profile = {
  kind: 'student' | 'teacher';
  id: number;
  first_name: string;
  last_name: string;
  username: string | null;
  must_change_password: boolean;
  groups: Group[];
};

export type LoginResponse = {
  token: string;
  expires_at: string;
  user: Profile;
};

export type AppConfig = {
  min_app_version: { android: string; ios: string };
};

export type ServerErrorCode =
  | 'not_found'
  | 'internal'
  | 'unavailable'
  | 'bad_request'
  | 'unauthorized'
  | 'rate_limited'
  | 'invalid_credentials'
  | 'account_locked'
  | 'password_change_required'
  | 'wrong_password'
  | 'weak_password'
  | 'invalid_username'
  | 'username_taken'
  | 'forbidden'
  | 'attendance_disabled'
  | 'too_early'
  | 'lesson_over'
  | 'session_closed'
  | 'invalid_code'
  | 'code_expired'
  | 'not_in_roster'
  | 'device_already_used'
  | 'marked_absent'
  | 'edit_window_closed'
  | 'set_by_admin'
  | 'invalid_attempt'
  | 'attempt_id_taken';

/** Server codes, plus what can go wrong before a response arrives. */
export type ErrorCode = ServerErrorCode | 'network' | 'timeout' | 'unknown';

// --- Attendance (teacher) ----------------------------------------------------

export type TeacherLesson = {
  group_id: number;
  group_name: string;
  discipline: string;
  office: string;
  classroom: string;
  begin_time: string; // "14:00", school time
  end_time: string;
  starts_at: string; // ISO date-time
  ends_at: string;
  students: number;
  attendance_enabled: boolean;
  learning_type: string;
  session: { id: string; status: 'open' | 'finished' } | null;
};

export type MarkState = 'pending' | 'present' | 'late' | 'absent';

export type AttendanceMark = {
  client_id: number;
  first_name: string;
  last_name: string;
  state: MarkState;
  /** admin: corrected by the office in the admin panel; the teacher can't change it. */
  source: 'scan' | 'teacher' | 'admin' | 'auto' | null;
  scanned_at: string | null;
};

export type AttendanceSession = {
  id: string;
  group_id: number;
  group_name: string;
  date: string;
  starts_at: string;
  ends_at: string;
  late_after: string;
  opened_at: string;
  finished_at: string | null;
  status: 'open' | 'finished';
  editable_until: string;
  qr?: { secret: string; window_seconds: number; server_time: string };
  counts: { total: number; present: number; late: number; absent: number; pending: number };
  marks: AttendanceMark[];
};

// --- Attendance (student) ----------------------------------------------------

export type GroupAttendance = {
  group_id: number;
  group_name: string;
  discipline: string;
  summary: { lessons: number; present: number; late: number; absent: number };
  days: { date: string; state: 'present' | 'late' | 'absent' }[]; // newest first
};

export type MyAttendance = { from: string; to: string; groups: GroupAttendance[] };
