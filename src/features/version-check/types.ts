export interface VersionCheckState {
  ignoredVersion: string;
  lastCheckedAt: number;
  latest: ReleaseVersionInfo | null;
}

export interface ReleaseVersionInfo {
  version: string;
  tagName: string;
  name: string;
  body: string;
  htmlUrl: string;
  downloadUrl: string;
  publishedAt: string;
}

export interface VersionCheckResult {
  currentVersion: string;
  updateAvailable: boolean;
  latest: ReleaseVersionInfo | null;
  ignored: boolean;
  error?: string;
}
