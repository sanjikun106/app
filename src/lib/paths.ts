/**
 * App routes for Next.js Link / router.
 * When basePath is set in next.config (GitHub Pages), Next.js adds it automatically —
 * do NOT prefix these paths manually.
 */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized;
}

/** Full URL for copy/share (includes GitHub Pages base path). */
export function absoluteAppUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  const p = appPath(path);
  if (typeof window === "undefined") {
    return `${base}${p}`;
  }
  return `${window.location.origin}${base}${p}`;
}
