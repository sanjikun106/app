/** Base path for GitHub Pages (/app) or empty for local dev */
export function basePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

export function href(path: string): string {
  const base = basePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
