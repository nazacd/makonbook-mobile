import { ApiError } from './client';

function minutes(seconds: number | undefined): string {
  const m = Math.max(1, Math.ceil((seconds ?? 60) / 60));
  if (m < 60) return m === 1 ? '1 minute' : `${m} minutes`;
  const h = Math.ceil(m / 60);
  return h === 1 ? '1 hour' : `${h} hours`;
}

// Words for errors any screen can hit. Screens handle the codes that belong to
// one of their fields (wrong_password next to the password field, and so on)
// themselves and fall back to this.
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case 'network':
      return "Can't reach MakonBook. Check your internet connection and try again.";
    case 'timeout':
      return 'MakonBook is taking too long to answer. Please try again.';
    case 'account_locked':
      return `Too many wrong passwords. For your security, try again in ${minutes(error.retryAfter)}.`;
    case 'rate_limited':
      return `Too many attempts. Try again in ${minutes(error.retryAfter)}.`;
    default:
      if (error.status >= 500) return 'MakonBook is having a problem right now. Please try again in a moment.';
      return error.requestId
        ? `Something went wrong. If it keeps happening, tell the office this code: ${error.requestId}`
        : 'Something went wrong. Please try again.';
  }
}
