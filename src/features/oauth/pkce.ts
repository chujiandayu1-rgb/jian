// OpenAI OAuth PKCE 工具：生成 code_verifier / code_challenge / state，
// 拼出授权 URL，并把回调收到的 code/state 换成 sub2api / CPA 格式的凭证。

import type { BuildAuthLinkResult, OAuthCredentials } from './types';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const TOKEN_URL = 'https://auth.openai.com/oauth/token';
const SCOPES = 'openid profile email offline_access';

export function defaultRedirectUri(): string {
  return 'http://localhost:1455/auth/callback';
}

export async function buildAuthorizeLink(redirectUri: string): Promise<BuildAuthLinkResult> {
  try {
    const codeVerifier = randomUrlSafe(64);
    const state = randomUrlSafe(32);
    const codeChallenge = await sha256UrlSafe(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      ok: true,
      message: '已生成 OAuth 授权链接',
      authUrl: `${AUTHORIZE_URL}?${params.toString()}`,
      state,
      codeVerifier,
      codeChallenge,
    };
  } catch (error) {
    return {
      ok: false,
      message: `生成授权链接失败：${errorMessage(error)}`,
    };
  }
}

export interface ExchangeTokenInput {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  email: string;
}

export interface ExchangeTokenResult {
  ok: boolean;
  message: string;
  credentials?: OAuthCredentials;
  raw?: unknown;
}

export async function exchangeAuthorizationCode(input: ExchangeTokenInput): Promise<ExchangeTokenResult> {
  if (!input.code) {
    return { ok: false, message: '缺少 code 参数' };
  }
  if (!input.codeVerifier) {
    return { ok: false, message: '缺少 code_verifier，请重新生成授权链接' };
  }

  let response: Response;
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    });

    response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      credentials: 'omit',
    });
  } catch (error) {
    return {
      ok: false,
      message: `调用 token 接口失败：${errorMessage(error)}`,
    };
  }

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) as Record<string, unknown> : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = stringField(data, 'error_description') || stringField(data, 'error') || text || response.statusText;
    return {
      ok: false,
      message: `换 token 失败：HTTP ${response.status} ${detail}`,
      raw: data,
    };
  }

  const accessToken = stringField(data, 'access_token');
  const refreshToken = stringField(data, 'refresh_token');
  const idToken = stringField(data, 'id_token');
  if (!accessToken) {
    return {
      ok: false,
      message: '响应里没有 access_token',
      raw: data,
    };
  }

  const expiresIn = Number(data.expires_in || 0);
  const now = Date.now();
  const expiredIso = expiresIn > 0 ? new Date(now + expiresIn * 1000).toISOString() : '';
  const lastRefreshIso = new Date(now).toISOString();
  const accountId = extractAccountId(idToken, accessToken);

  const credentials: OAuthCredentials = {
    access_token: accessToken,
    account_id: accountId,
    disabled: false,
    email: input.email,
    expired: expiredIso,
    id_token: idToken,
    last_refresh: lastRefreshIso,
    refresh_token: refreshToken,
    type: 'codex',
  };

  return {
    ok: true,
    message: '已换取 token',
    credentials,
    raw: data,
  };
}

export function buildSub2apiJson(credentials: OAuthCredentials): string {
  return JSON.stringify(
    {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      id_token: credentials.id_token,
      account_id: credentials.account_id,
      email: credentials.email,
      expired: credentials.expired,
      last_refresh: credentials.last_refresh,
      type: credentials.type,
    },
    null,
    2,
  );
}

export function buildCpaJson(credentials: OAuthCredentials): string {
  return JSON.stringify(
    {
      OPENAI_API_KEY: '',
      tokens: {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        id_token: credentials.id_token,
        account_id: credentials.account_id,
      },
      last_refresh: credentials.last_refresh,
    },
    null,
    2,
  );
}

export function parseCallbackUrl(callback: string): { code: string; state: string } {
  try {
    const url = new URL(callback.trim());
    return {
      code: url.searchParams.get('code') || '',
      state: url.searchParams.get('state') || '',
    };
  } catch {
    // 兼容用户只贴 `code=xxx&state=xxx` 的情况
    const params = new URLSearchParams(callback.replace(/^\?/, ''));
    return {
      code: params.get('code') || '',
      state: params.get('state') || '',
    };
  }
}

function extractAccountId(idToken: string, accessToken: string): string {
  const fromIdToken = decodeJwtClaim(idToken, 'chatgpt_account_id') ||
    decodeJwtClaim(idToken, 'sub') ||
    '';
  if (fromIdToken) {
    return fromIdToken;
  }
  return decodeJwtClaim(accessToken, 'chatgpt_account_id') ||
    decodeJwtClaim(accessToken, 'sub') ||
    '';
}

function decodeJwtClaim(token: string, claim: string): string {
  if (!token) {
    return '';
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return '';
  }
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    const value = payload[claim];
    return typeof value === 'string' ? value : value !== undefined && value !== null ? String(value) : '';
  } catch {
    return '';
  }
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + (4 - (value.length % 4 || 4)) % 4, '=');
  if (typeof atob === 'function') {
    try {
      return decodeURIComponent(
        atob(padded)
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
    } catch {
      return atob(padded);
    }
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function randomUrlSafe(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncodeBytes(bytes).slice(0, length);
}

async function sha256UrlSafe(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringField(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  return typeof value === 'string' ? value : '';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
