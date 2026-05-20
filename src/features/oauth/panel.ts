import { loadOAuthState, loadRegisterState, resetOAuthState, saveOAuthState } from '../../app/state';
import type { FeaturePanelHandle } from '../../app/types';
import { parseAccountInput } from '../register/account-input';
import {
  buildAuthorizeLink,
  buildCpaJson,
  buildSub2apiJson,
  defaultRedirectUri,
  exchangeAuthorizationCode,
  parseCallbackUrl,
} from './pkce';
import type { OAuthCredentials, OAuthState } from './types';

export function createOAuthPanel(container: HTMLElement): FeaturePanelHandle {
  const summary = document.createElement('div');
  summary.className = 'opx-summary';
  summary.textContent = 'OAuth 状态：未启动';

  const emailInput = createInput('OAuth 登录邮箱（自动同步注册 tab）', 'email');
  const redirectInput = createInput('Redirect URI', 'text');
  redirectInput.placeholder = defaultRedirectUri();

  const generateButton = createButton('生成授权链接并打开');
  const authUrlOutput = document.createElement('textarea');
  authUrlOutput.className = 'opx-textarea opx-output';
  authUrlOutput.placeholder = '生成后的 OAuth 授权链接';
  authUrlOutput.readOnly = true;
  authUrlOutput.spellcheck = false;

  const authButtonRow = document.createElement('div');
  authButtonRow.className = 'opx-button-row';
  const copyAuthButton = createButton('复制链接', 'opx-button opx-button-secondary');
  const openAuthButton = createButton('打开链接', 'opx-button opx-button-secondary');
  const resetButton = createButton('重置', 'opx-button opx-button-secondary');
  authButtonRow.append(copyAuthButton, openAuthButton, resetButton);

  const callbackInput = document.createElement('textarea');
  callbackInput.className = 'opx-textarea';
  callbackInput.placeholder = '把回调 URL 或 code=xxx&state=xxx 粘贴到这里';
  callbackInput.spellcheck = false;
  callbackInput.autocomplete = 'off';

  const exchangeButton = createButton('换取 token');

  const credentialsCard = document.createElement('div');
  credentialsCard.className = 'opx-session-card';
  const accessTokenRow = createRow('access_token', '未获取');
  const accountIdRow = createRow('account_id', '未获取');
  const refreshTokenRow = createRow('refresh_token', '未获取');
  const expiredRow = createRow('expired', '未获取');
  credentialsCard.append(accessTokenRow.row, accountIdRow.row, refreshTokenRow.row, expiredRow.row);

  const exportRow = document.createElement('div');
  exportRow.className = 'opx-button-row';
  const copyCodeStateButton = createButton('复制 code/state', 'opx-button opx-button-secondary');
  const downloadSub2apiButton = createButton('下载 sub2api JSON', 'opx-button opx-button-secondary');
  const downloadCpaButton = createButton('下载 CPA JSON', 'opx-button opx-button-secondary');
  exportRow.append(copyCodeStateButton, downloadSub2apiButton, downloadCpaButton);

  const status = document.createElement('div');
  status.className = 'opx-status';
  status.textContent = '尚未生成授权链接';

  let cachedState: OAuthState | null = null;

  const update = async () => {
    const state = await loadOAuthState();
    cachedState = state;
    if (!emailInput.value) {
      emailInput.value = state.email || (await deriveEmailFromRegisterTab());
    }
    redirectInput.value = state.redirectUri || defaultRedirectUri();
    authUrlOutput.value = state.authUrl;
    if (state.callbackUrl && !callbackInput.value) {
      callbackInput.value = state.callbackUrl;
    }
    setSummary(state);
    refreshCredentialsCard(state.credentials);
    refreshExportButtons(state);
    if (state.exchangeStatus === 'error' && state.exchangeMessage) {
      setStatus(status, state.exchangeMessage, 'error');
    } else if (state.exchangeStatus === 'success' && state.credentials) {
      setStatus(status, state.exchangeMessage || '已获取 token', 'ok');
    }
  };

  const onShow = async () => {
    if (!emailInput.value) {
      emailInput.value = await deriveEmailFromRegisterTab();
    }
    await update();
  };

  emailInput.addEventListener('input', () => {
    void saveOAuthState({ email: emailInput.value.trim() });
  });

  redirectInput.addEventListener('input', () => {
    void saveOAuthState({ redirectUri: redirectInput.value.trim() || defaultRedirectUri() });
  });

  generateButton.addEventListener('click', async () => {
    if (generateButton.disabled) {
      return;
    }
    generateButton.disabled = true;
    setStatus(status, '正在生成授权链接...', 'pending');
    try {
      const redirectUri = redirectInput.value.trim() || defaultRedirectUri();
      const result = await buildAuthorizeLink(redirectUri);
      if (!result.ok || !result.authUrl) {
        setStatus(status, result.message, 'error');
        return;
      }
      const next = await saveOAuthState({
        codeVerifier: result.codeVerifier || '',
        codeChallenge: result.codeChallenge || '',
        state: result.state || '',
        redirectUri,
        authUrl: result.authUrl,
        email: emailInput.value.trim(),
        startedAt: Date.now(),
        callbackUrl: '',
        codeParam: '',
        exchangeStatus: 'idle',
        exchangeMessage: '',
        credentials: null,
        cpaJson: '',
        sub2apiJson: '',
      });
      cachedState = next;
      authUrlOutput.value = next.authUrl;
      callbackInput.value = '';
      window.open(next.authUrl, '_blank', 'noopener,noreferrer');
      setSummary(next);
      refreshCredentialsCard(next.credentials);
      refreshExportButtons(next);
      setStatus(status, '已打开授权页，登录后把回调链接粘贴到下面。', 'ok');
    } catch (error) {
      setStatus(status, `生成失败：${errorMessage(error)}`, 'error');
    } finally {
      generateButton.disabled = false;
    }
  });

  copyAuthButton.addEventListener('click', async () => {
    if (!authUrlOutput.value) {
      return;
    }
    await navigator.clipboard.writeText(authUrlOutput.value);
    setStatus(status, '已复制授权链接', 'ok');
  });

  openAuthButton.addEventListener('click', () => {
    if (authUrlOutput.value) {
      window.open(authUrlOutput.value, '_blank', 'noopener,noreferrer');
    }
  });

  resetButton.addEventListener('click', async () => {
    const next = await resetOAuthState();
    cachedState = next;
    authUrlOutput.value = '';
    callbackInput.value = '';
    refreshCredentialsCard(null);
    refreshExportButtons(next);
    setSummary(next);
    setStatus(status, '已重置 OAuth 状态', 'ok');
  });

  exchangeButton.addEventListener('click', async () => {
    if (exchangeButton.disabled) {
      return;
    }
    exchangeButton.disabled = true;
    setStatus(status, '正在换取 token...', 'pending');
    try {
      const state = cachedState || (await loadOAuthState());
      if (!state.codeVerifier) {
        setStatus(status, '请先生成授权链接', 'error');
        return;
      }

      const callback = callbackInput.value.trim();
      if (!callback) {
        setStatus(status, '请粘贴回调 URL 或 code=xxx&state=xxx', 'error');
        return;
      }

      const parsed = parseCallbackUrl(callback);
      if (!parsed.code) {
        setStatus(status, '回调里没有 code 参数', 'error');
        return;
      }
      if (state.state && parsed.state && state.state !== parsed.state) {
        setStatus(status, 'state 不一致，可能有 CSRF 风险，请重新生成授权链接', 'error');
        return;
      }

      await saveOAuthState({
        callbackUrl: callback,
        codeParam: parsed.code,
        exchangeStatus: 'pending',
        exchangeMessage: '',
      });

      const result = await exchangeAuthorizationCode({
        code: parsed.code,
        codeVerifier: state.codeVerifier,
        redirectUri: state.redirectUri || defaultRedirectUri(),
        email: emailInput.value.trim() || state.email,
      });

      if (!result.ok || !result.credentials) {
        const next = await saveOAuthState({
          exchangeStatus: 'error',
          exchangeMessage: result.message,
        });
        cachedState = next;
        setSummary(next);
        setStatus(status, result.message, 'error');
        return;
      }

      const sub2api = buildSub2apiJson(result.credentials);
      const cpa = buildCpaJson(result.credentials);
      const next = await saveOAuthState({
        credentials: result.credentials,
        sub2apiJson: sub2api,
        cpaJson: cpa,
        exchangeStatus: 'success',
        exchangeMessage: '已换取 token',
      });
      cachedState = next;
      refreshCredentialsCard(next.credentials);
      refreshExportButtons(next);
      setSummary(next);
      setStatus(status, '已换取 token', 'ok');
    } catch (error) {
      const next = await saveOAuthState({
        exchangeStatus: 'error',
        exchangeMessage: `换取失败：${errorMessage(error)}`,
      });
      cachedState = next;
      setSummary(next);
      setStatus(status, next.exchangeMessage, 'error');
    } finally {
      exchangeButton.disabled = false;
    }
  });

  copyCodeStateButton.addEventListener('click', async () => {
    const state = cachedState || (await loadOAuthState());
    if (!state.codeParam) {
      setStatus(status, '没有 code，先粘贴回调 URL 并换取 token', 'error');
      return;
    }
    const text = `code=${state.codeParam}&state=${state.state}`;
    await navigator.clipboard.writeText(text);
    setStatus(status, '已复制 code/state', 'ok');
  });

  downloadSub2apiButton.addEventListener('click', async () => {
    const state = cachedState || (await loadOAuthState());
    if (!state.sub2apiJson) {
      setStatus(status, '还没有 sub2api JSON，请先换取 token', 'error');
      return;
    }
    triggerDownload(state.sub2apiJson, fileNameFor(state, 'sub2api'));
    setStatus(status, '已下载 sub2api JSON', 'ok');
  });

  downloadCpaButton.addEventListener('click', async () => {
    const state = cachedState || (await loadOAuthState());
    if (!state.cpaJson) {
      setStatus(status, '还没有 CPA JSON，请先换取 token', 'error');
      return;
    }
    triggerDownload(state.cpaJson, fileNameFor(state, 'cpa'));
    setStatus(status, '已下载 CPA JSON', 'ok');
  });

  container.append(
    summary,
    createField('OAuth 邮箱', emailInput),
    createField('Redirect URI', redirectInput),
    generateButton,
    createField('授权链接', authUrlOutput),
    authButtonRow,
    createField('回调 URL / code', callbackInput),
    exchangeButton,
    credentialsCard,
    exportRow,
    status,
  );

  void update();
  return { update, onShow };

  function setSummary(state: OAuthState): void {
    const lines: string[] = [];
    if (state.email) {
      lines.push(`邮箱：${state.email}`);
    }
    lines.push(`状态：${describeStatus(state)}`);
    if (state.exchangeStatus === 'success' && state.credentials?.account_id) {
      lines.push(`account_id：${state.credentials.account_id}`);
    }
    summary.textContent = lines.join(' · ');
  }

  function refreshCredentialsCard(credentials: OAuthCredentials | null): void {
    accessTokenRow.value.textContent = credentials?.access_token ? truncate(credentials.access_token, 36) : '未获取';
    accountIdRow.value.textContent = credentials?.account_id || '未获取';
    refreshTokenRow.value.textContent = credentials?.refresh_token ? truncate(credentials.refresh_token, 36) : '未获取';
    expiredRow.value.textContent = credentials?.expired || '未获取';
  }

  function refreshExportButtons(state: OAuthState): void {
    copyCodeStateButton.disabled = !state.codeParam;
    downloadSub2apiButton.disabled = !state.sub2apiJson;
    downloadCpaButton.disabled = !state.cpaJson;
  }

  async function deriveEmailFromRegisterTab(): Promise<string> {
    try {
      const register = await loadRegisterState();
      const parsed = parseAccountInput(register.rawInput);
      if (parsed.ok && parsed.email) {
        return parsed.email;
      }
      return register.email || '';
    } catch {
      return '';
    }
  }
}

function describeStatus(state: OAuthState): string {
  if (state.exchangeStatus === 'success') {
    return '已获取 token';
  }
  if (state.exchangeStatus === 'pending') {
    return '正在换取 token...';
  }
  if (state.exchangeStatus === 'error') {
    return `失败 - ${state.exchangeMessage}`;
  }
  if (state.authUrl) {
    return '等待回调';
  }
  return '未启动';
}

function fileNameFor(state: OAuthState, suffix: string): string {
  const base = (state.credentials?.email || state.email || 'codex').replace(/[^a-z0-9._-]/gi, '_');
  return `${base}.${suffix}.json`;
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.documentElement.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function createInput(placeholder: string, type: string): HTMLInputElement {
  const input = document.createElement('input');
  input.className = 'opx-input';
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.spellcheck = false;
  return input;
}

function createButton(label: string, className = 'opx-button'): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = label;
  return button;
}

function createField(label: string, control: HTMLElement): HTMLElement {
  const field = document.createElement('label');
  field.className = 'opx-field';
  const caption = document.createElement('span');
  caption.className = 'opx-label';
  caption.textContent = label;
  field.append(caption, control);
  return field;
}

function createRow(label: string, initial: string): { row: HTMLElement; value: HTMLElement } {
  const row = document.createElement('div');
  row.className = 'opx-session-row';
  const labelEl = document.createElement('span');
  labelEl.textContent = label;
  const value = document.createElement('strong');
  value.textContent = initial;
  row.append(labelEl, value);
  return { row, value };
}

function setStatus(element: HTMLElement, message: string, type: 'pending' | 'ok' | 'error'): void {
  element.textContent = message;
  element.dataset.type = type;
}

function truncate(text: string, length: number): string {
  if (!text) {
    return '';
  }
  return text.length <= length ? text : `${text.slice(0, length)}...`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
