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
  | 'username_taken';

/** Server codes, plus what can go wrong before a response arrives. */
export type ErrorCode = ServerErrorCode | 'network' | 'timeout' | 'unknown';
