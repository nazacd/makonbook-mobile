import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Package } from './types';

// The web build (development only) keeps packages in storage and shows images
// from their links, which work for a few hours: enough to try a test.

const key = (code: string, version: number) => `@makonbook/practice/web-package/${code}/v${version}`;
const linksKey = '@makonbook/practice/web-images';
let links: Record<string, string> = {};

// Read when a package is, not when this module loads (web pages are also
// rendered on the server, where there is no storage).
async function loadLinks() {
  const raw = await AsyncStorage.getItem(linksKey);
  if (raw) links = { ...JSON.parse(raw), ...links };
}

export async function storeDownload(
  pkg: Package,
  fresh: Record<string, string>,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  await loadLinks();
  links = { ...links, ...fresh };
  await AsyncStorage.setItem(linksKey, JSON.stringify(links));
  await AsyncStorage.setItem(key(pkg.code, pkg.version), JSON.stringify(pkg));
  onProgress(1, 1);
}

export async function readPackage(code: string, version: number): Promise<Package | null> {
  await loadLinks();
  const raw = await AsyncStorage.getItem(key(code, version));
  return raw ? (JSON.parse(raw) as Package) : null;
}

export function removePackages(code: string) {
  AsyncStorage.getAllKeys().then((keys) =>
    AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(`@makonbook/practice/web-package/${code}/`))),
  );
}

export function imageUri(file: string): string {
  return links[file] ?? '';
}
