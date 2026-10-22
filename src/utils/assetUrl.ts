/**
 * Resolves static asset URLs reliably across local dev, custom domains,
 * and GitHub Pages subdirectory deployments (e.g. https://treevant26.github.io/instanceutil/).
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // Detect GitHub Pages repo subpath (e.g., /instanceutil/)
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    const repoName = window.location.pathname.split('/').filter(Boolean)[0] || 'instanceutil';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path.replace(/^\.\//, '');
    return `/${repoName}/${cleanPath}`;
  }

  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path.replace(/^\.\//, '');
  return `${cleanBase}${cleanPath}`;
}
