export function normalizeRoutePath(path?: string | null): string {
  if (!path) return "/";

  const trimmed = path.trim();
  if (!trimmed) {
    return "/";
  }

  const normalized = trimmed.startsWith("/") ? trimmed.toLowerCase() : `/${trimmed.toLowerCase()}`;
  return normalized.replace(/\/+/g, "/");
}

export function arePathsEqual(pathA?: string | null, pathB?: string | null): boolean {
  return normalizeRoutePath(pathA) === normalizeRoutePath(pathB);
}

