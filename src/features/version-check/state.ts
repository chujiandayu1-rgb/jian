import type { ReleaseVersionInfo, VersionCheckState } from './types';

const STORAGE_KEY = 'opx.versionCheck.state';

const DEFAULT_STATE: VersionCheckState = {
  ignoredVersion: '',
  lastCheckedAt: 0,
  latest: null,
};

export async function loadVersionCheckState(): Promise<VersionCheckState> {
  const data = await browser.storage.local.get(STORAGE_KEY);
  return normalizeVersionCheckState(data[STORAGE_KEY]);
}

export async function saveVersionCheckState(patch: Partial<VersionCheckState>): Promise<VersionCheckState> {
  const current = await loadVersionCheckState();
  const next = normalizeVersionCheckState({
    ...current,
    ...patch,
  });
  await browser.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

export async function ignoreReleaseVersion(version: string): Promise<VersionCheckState> {
  return saveVersionCheckState({ ignoredVersion: normalizeVersion(version) });
}

function normalizeVersionCheckState(value: unknown): VersionCheckState {
  const source = isRecord(value) ? value : {};
  return {
    ignoredVersion: normalizeVersion(source.ignoredVersion),
    lastCheckedAt: Number(source.lastCheckedAt || DEFAULT_STATE.lastCheckedAt),
    latest: normalizeReleaseVersionInfo(source.latest),
  };
}

function normalizeReleaseVersionInfo(value: unknown): ReleaseVersionInfo | null {
  if (!isRecord(value)) {
    return null;
  }

  const version = normalizeVersion(value.version);
  const htmlUrl = String(value.htmlUrl || '').trim();
  if (!version || !htmlUrl) {
    return null;
  }

  return {
    version,
    tagName: String(value.tagName || version).trim(),
    name: String(value.name || value.tagName || version).trim(),
    body: String(value.body || '').trim(),
    htmlUrl,
    downloadUrl: String(value.downloadUrl || htmlUrl).trim(),
    publishedAt: String(value.publishedAt || '').trim(),
  };
}

function normalizeVersion(value: unknown): string {
  return String(value || '').trim().replace(/^v/i, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}
