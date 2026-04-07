/**
 * Backend origin (no trailing slash). Browser code must use NEXT_PUBLIC_* so
 * Vercel injects it at build time — never hardcode localhost in client bundles.
 */
export function getPublicApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  return (raw || 'http://localhost:5000').replace(/\/+$/, '');
}

/** Absolute URL to an API or static path on the backend, e.g. /api/auth/login */
export function publicApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${p}`;
}

/** Paths like /uploads/... returned by the API */
export function publicAssetUrl(pathFromRoot: string): string {
  return publicApiUrl(pathFromRoot);
}

/** Next.js Route Handlers (server): BACKEND_URL for server-only, else public URL */
export function getServerBackendBaseUrl(): string {
  const raw = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  return (raw || 'http://localhost:5000').replace(/\/+$/, '');
}
