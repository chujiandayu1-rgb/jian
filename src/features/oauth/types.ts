export type OAuthExchangeStatus = 'idle' | 'pending' | 'success' | 'error';

export interface OAuthCredentials {
  access_token: string;
  account_id: string;
  disabled: boolean;
  email: string;
  expired: string;
  id_token: string;
  last_refresh: string;
  refresh_token: string;
  type: 'codex';
}

export interface OAuthState {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  redirectUri: string;
  authUrl: string;
  email: string;
  password: string;
  startedAt: number;
  callbackUrl: string;
  codeParam: string;
  exchangeStatus: OAuthExchangeStatus;
  exchangeMessage: string;
  credentials: OAuthCredentials | null;
  cpaJson: string;
  sub2apiJson: string;
  updatedAt: number;
}

export interface BuildAuthLinkResult {
  ok: boolean;
  message: string;
  authUrl?: string;
  state?: string;
  codeVerifier?: string;
  codeChallenge?: string;
}
