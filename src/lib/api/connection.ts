import { useEffect, useState } from 'react';

import { ApiError } from './client';
import { useMe } from './queries';

/** How long a refresh may take before "Updating…" shows: a quick one stays invisible. */
const SLOW_MS = 1500;

/**
 * Whether the server can be reached, judged by the profile refresh (it runs
 * at launch, on returning to the app, and every half minute while offline):
 * offline when it last failed for want of a connection, updating while a
 * refresh takes long, and when the data on screen was last fetched.
 */
export function useConnection() {
  const me = useMe();
  // The last refresh failed for want of a connection; it stays so while the
  // next one is tried, until one gets through.
  const offline = me.error instanceof ApiError && (me.error.code === 'network' || me.error.code === 'timeout');
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!me.isFetching) return;
    const id = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [me.isFetching]);
  return { offline, updating: !offline && me.isFetching && slow, updatedAt: me.dataUpdatedAt || null };
}
