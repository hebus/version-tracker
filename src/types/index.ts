export interface PackageGroup {
  id: string;
  name: string;
  packages: string[];
}

export interface Config {
  verdaccioUrl: string;
  refreshInterval: number;
  groups: PackageGroup[];
}

export interface TagInfo {
  tag: string;
  version: string;
  publishedAt: string | null;
}

export interface VersionInfo {
  latest: string | null;
  publishedAt: string | null;
  tags: TagInfo[];
  error: string | null;
}

export interface PackageVersions {
  name: string;
  npm: VersionInfo;
  verdaccio: VersionInfo;
}

export type PackageStatus =
  | "synced"
  | "npm-ahead"
  | "verdaccio-ahead"
  | "npm-only"
  | "verdaccio-only"
  | "error"
  | "loading";

export function computeStatus(versions: PackageVersions): PackageStatus {
  return computeVersionStatus(versions.npm.latest, versions.verdaccio.latest);
}

export function computeVersionStatus(
  npmVersion: string | null | undefined,
  verdaccioVersion: string | null | undefined,
): PackageStatus {
  const npmOk = !!npmVersion;
  const verdaccioOk = !!verdaccioVersion;

  if (!npmOk && !verdaccioOk) return "error";
  if (!npmOk) return "verdaccio-only";
  if (!verdaccioOk) return "npm-only";
  if (npmVersion === verdaccioVersion) return "synced";

  return compareSemver(npmVersion!, verdaccioVersion!) > 0
    ? "npm-ahead"
    : "verdaccio-ahead";
}

export function compareSemver(a: string, b: string): number {
  const parse = (v: string) =>
    v.replace(/^v/, "").split("-")[0].split(".").map(Number);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export interface VersionEvent {
  type: "new_version";
  packageName: string;
  npmVersion: string | null;
  verdaccioVersion: string | null;
}

export interface StoredNotification {
  id: string;
  event: VersionEvent;
  timestamp: string;
  read: boolean;
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
  return `il y a ${Math.floor(seconds / 86400)}j`;
}

export function allPackages(config: Config): string[] {
  return (config.groups ?? []).flatMap((g) => g.packages ?? []);
}
