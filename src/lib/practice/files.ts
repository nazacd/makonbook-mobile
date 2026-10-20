import { Directory, File, Paths } from 'expo-file-system';

import type { Package } from './types';

// Downloaded tests on the phone: each version's package as JSON, and the
// images, shared by every test (they are named by their bytes, so a file
// already here is never fetched again). On disk, not in AsyncStorage: a
// package is about 120 KB and images run to megabytes.

const root = new Directory(Paths.document, 'practice');
const images = new Directory(root, 'img');

function packageFile(code: string, version: number) {
  return new File(root, code, `v${version}.json`);
}

/** Stores the images (links from the API) and then the package, so a stored package means a complete download. */
export async function storeDownload(
  pkg: Package,
  links: Record<string, string>,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  images.create({ intermediates: true, idempotent: true });
  const files = [...new Set(Object.values(pkg.images).map((i) => i.file))];
  const missing = files.filter((f) => !new File(images, f).exists);
  let done = files.length - missing.length;
  onProgress(done, files.length);
  // A few at a time: fast on a good connection without flooding a weak one.
  const queue = [...missing];
  const worker = async () => {
    for (let name = queue.shift(); name; name = queue.shift()) {
      const url = links[name];
      if (!url) throw new Error(`no link for ${name}`);
      // Into a temporary file first: on Android a failed download can leave
      // a partial file behind, which must never pass for the image.
      const part = new File(images, `${name}.part`);
      await File.downloadFileAsync(url, part, { idempotent: true });
      await part.move(new File(images, name), { overwrite: true });
      onProgress(++done, files.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  const file = packageFile(pkg.code, pkg.version);
  file.parentDirectory.create({ intermediates: true, idempotent: true });
  file.write(JSON.stringify(pkg));
}

export async function readPackage(code: string, version: number): Promise<Package | null> {
  const file = packageFile(code, version);
  if (!file.exists) return null;
  return JSON.parse(await file.text()) as Package;
}

/** Removes a test's packages (images stay: other tests may use them). */
export function removePackages(code: string) {
  const dir = new Directory(root, code);
  if (dir.exists) dir.delete();
}

/** Where an image file is on the phone. */
export function imageUri(file: string): string {
  return new File(images, file).uri;
}
