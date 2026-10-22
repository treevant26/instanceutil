/**
 * Resolves static asset URLs relative to Vite's configured BASE_URL.
 * This guarantees assets load correctly on both domain roots and subdirectory
 * deployments such as GitHub Pages (e.g. https://treevant26.github.io/instanceutil/).
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
