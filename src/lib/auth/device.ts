import { randomUUID } from 'expo-crypto';

import { getItem, setItem } from './secure-storage';

const KEY = 'makonbook.device_id';

let cached: string | null = null;

// A random id generated once per install, sent with every login so the server
// can tell a person's devices apart. It identifies the install, not the phone.
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  let id = await getItem(KEY);
  if (!id) {
    id = randomUUID();
    await setItem(KEY, id);
  }
  cached = id;
  return id;
}
