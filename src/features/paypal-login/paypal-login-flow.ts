// paypal.com 已有账号登录授权流程(对应 GuJumpgate content/paypal-flow.js + background/steps/paypal-approve.js)
// 与 src/features/address-autofill/paypal-autofill.ts 不同:那个是给 paypal.com/checkoutweb/signup 注册"新"PayPal 账号用的;
// 这个是从 pay.openai 跳转过来的"已有 PayPal 账号登录并点同意并继续"的场景。
//
// 核心逻辑(状态机,反复轮询页面状态再决定下一动作):
//   ① inspectPayPalState() 读取当前页面是邮箱页 / 密码页 / 同页 / Passkey 弹窗 / 已可同意
//   ② needsLogin → submitLogin (refill email → 等 next button enabled → click → 等密码页 → fillInput password → 等 login button enabled → click)
//   ③ hasPasskeyPrompt → dismissPrompts (点"取消/稍后/不保存/关闭")
//   ④ approveReady → clickApprove
//   ⑤ 跳转离开 paypal.com → 返回 left_paypal,交给 orchestrator 处理"等回跳"

const LOG_PREFIX = '[OPX PayPalLogin]';

export interface PayPalPageState {
  url: string;
  needsLogin: boolean;
  loginPhase: '' | 'email' | 'password' | 'login_combined';
  hasEmailInput: boolean;
  hasPasswordInput: boolean;
  approveReady: boolean;
  approveButtonText: string;
  hasPasskeyPrompt: boolean;
}

export interface SubmitLoginResult {
  submitted: boolean;
  phase: 'email_submitted' | 'password_submitted' | 'noop';
  awaiting?: 'password_page' | 'redirect_or_approval';
  error?: string;
}

export function isPayPalDomain(): boolean {
  return /(^|\.)paypal\.com$/i.test(location.hostname);
}

export function inspectPayPalState(): PayPalPageState {
  const emailInput = findEmailInput();
  const passwordInput = findPasswordInput();
  const approveButton = findApproveButton();
  const loginPhase = getPayPalLoginPhase(emailInput, passwordInput);
  return {
    url: location.href,
    needsLogin: Boolean(loginPhase),
    loginPhase,
    hasEmailInput: Boolean(emailInput),
    hasPasswordInput: Boolean(passwordInput),
    approveReady: Boolean(approveButton && isEnabled(approveButton)),
    approveButtonText: approveButton ? getActionText(approveButton) : '',
    hasPasskeyPrompt: hasPasskeyPrompt(),
  };
}

export async function submitPayPalLogin(payload: { email: string; password: string }): Promise<SubmitLoginResult> {
  await waitForDocumentComplete();

  const email = normalizeText(payload.email);
  const password = String(payload.password || '');
  if (!password) {
    return { submitted: false, phase: 'noop', error: 'PayPal 密码为空' };
  }

  let passwordInput = findPasswordInput();
  const emailInput = findEmailInput();
  const emailNextButton = findEmailNextButton();

  // 阶段 A:两步式邮箱页 — 只有邮箱框 + Next 按钮
  if (emailInput && emailNextButton && isEnabled(emailNextButton) && (!passwordInput || !findPasswordLoginButton())) {
    refillPayPalEmail(emailInput, email);
    simulateNativeClick(emailNextButton);
    console.info(`${LOG_PREFIX} email submitted (two-step)`);
    return { submitted: false, phase: 'email_submitted', awaiting: 'password_page' };
  }

  // 阶段 B:邮箱框出现但还没密码框 — 也按邮箱页处理
  if (!passwordInput && emailInput && email) {
    refillPayPalEmail(emailInput, email);
    const nextButton = await waitFor(() => {
      const button = findEmailNextButton() || findLoginNextButton();
      return button && isEnabled(button) ? button : null;
    }, 8000);
    if (!nextButton) {
      return { submitted: false, phase: 'noop', error: 'PayPal 邮箱页找不到 Next 按钮' };
    }
    simulateNativeClick(nextButton);
    console.info(`${LOG_PREFIX} email submitted (no password yet)`);
    return { submitted: false, phase: 'email_submitted', awaiting: 'password_page' };
  }

  if (!passwordInput && emailInput && !email) {
    return { submitted: false, phase: 'noop', error: 'PayPal 账号为空' };
  }

  // 阶段 C:邮箱+密码同页(老布局) — 先填邮箱
  if (emailInput && email) {
    refillPayPalEmail(emailInput, email);
  }

  // 阶段 D:等密码框出现并填密码
  if (!passwordInput) {
    passwordInput = await waitFor(() => findPasswordInput(), 8000);
  }
  if (!passwordInput) {
    return { submitted: false, phase: 'noop', error: 'PayPal 密码框未出现' };
  }

  fillInputElement(passwordInput, password);
  await sleep(1000);

  // 阶段 E:等"登录/继续"按钮变 enabled
  const loginButton = await waitFor(() => {
    const button = findClickableByText([/login|sign\s*in|log\s*in|continue/i, /登录|登入|继续/i]);
    return button && isEnabled(button) ? button : null;
  }, 8000);
  if (!loginButton) {
    return { submitted: false, phase: 'noop', error: 'PayPal 密码页找不到登录按钮' };
  }
  simulateNativeClick(loginButton);
  console.info(`${LOG_PREFIX} password submitted`);
  return { submitted: true, phase: 'password_submitted', awaiting: 'redirect_or_approval' };
}

// 关掉 Passkey / 保存登录 / 不用 / 稍后 之类的弹窗
export async function dismissPayPalPrompts(): Promise<{ clicked: number }> {
  await waitForDocumentComplete();
  const buttons = findPasskeyPromptButtons();
  let clicked = 0;
  for (const button of buttons) {
    if (!isVisible(button) || !isEnabled(button)) continue;
    simulateNativeClick(button);
    clicked += 1;
    await sleep(500);
  }
  if (clicked > 0) console.info(`${LOG_PREFIX} dismissed ${clicked} prompts`);
  return { clicked };
}

export async function clickPayPalApprove(): Promise<{ clicked: boolean; buttonText: string }> {
  await waitForDocumentComplete();
  await dismissPayPalPrompts().catch(() => ({ clicked: 0 }));

  const button = findApproveButton();
  if (!button || !isEnabled(button)) {
    return { clicked: false, buttonText: button ? getActionText(button) : '' };
  }
  simulateNativeClick(button);
  console.info(`${LOG_PREFIX} clicked approve`);
  return { clicked: true, buttonText: getActionText(button) };
}

// ============================================================
// 内部:元素定位
// ============================================================

function findEmailInput(): HTMLInputElement | null {
  // 多种 fallback,覆盖新老布局
  return (
    document.querySelector<HTMLInputElement>('input#email') ||
    document.querySelector<HTMLInputElement>('input[name="login_email"]') ||
    document.querySelector<HTMLInputElement>('input[name="email"]') ||
    document.querySelector<HTMLInputElement>('input[type="email"]') ||
    findInputByPatterns([/login_?email/i, /email|邮箱|账户/i])
  );
}

function findPasswordInput(): HTMLInputElement | null {
  return (
    document.querySelector<HTMLInputElement>('input#password') ||
    document.querySelector<HTMLInputElement>('input[name="login_password"]') ||
    document.querySelector<HTMLInputElement>('input[name="password"]') ||
    document.querySelector<HTMLInputElement>('input[type="password"]') ||
    findInputByPatterns([/login_?password/i, /password|密码/i])
  );
}

function findEmailNextButton(): HTMLElement | null {
  // 两步式登录的"下一步/Next"
  const direct = document.querySelector<HTMLElement>('#btnNext') || document.querySelector<HTMLElement>('button[name="btnNext"]');
  if (direct) return direct;
  return findClickableByText([/^\s*(next|continue|下一步|继续)\s*$/i]);
}

function findLoginNextButton(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('#btnLogin') ||
    document.querySelector<HTMLElement>('button[name="btnLogin"]') ||
    findClickableByText([/^\s*(log\s*in|sign\s*in|login|登录|登入)\s*$/i])
  );
}

function findPasswordLoginButton(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('#btnLogin') ||
    document.querySelector<HTMLElement>('button[name="btnLogin"]') ||
    findClickableByText([/login|sign\s*in|log\s*in|continue/i, /登录|登入|继续/i])
  );
}

function findApproveButton(): HTMLElement | null {
  // PayPal Hermes 同意页 / 老版 approve 页
  return (
    document.querySelector<HTMLElement>('#consentButton') ||
    document.querySelector<HTMLElement>('#payment-submit-btn') ||
    document.querySelector<HTMLElement>('button[name="ConfirmButtons"]') ||
    findClickableByText([
      /^\s*(agree\s*(and|&)\s*continue|continue|pay\s*now|complete\s*purchase|confirm)\s*$/i,
      /^\s*(同意并继续|同意.{0,4}继续|继续|确认|立即付款)\s*$/,
    ])
  );
}

function findPasskeyPromptButtons(): HTMLElement[] {
  const bodyText = normalizeText(document.body?.innerText || '');
  const likely = /passkey|通行密钥|安全密钥|下次登录|faster|save\s*your\s*info/i.test(bodyText);
  if (!likely) return [];

  const cancelOrClose = visibleControls('button, a, [role="button"]').filter((el) => {
    const text = getActionText(el);
    const aria = el.getAttribute?.('aria-label') || '';
    return (
      /取消|稍后|不保存|不用|关闭|cancel|not now|maybe later|skip|close|^x$|^×$/i.test(text) ||
      /close|关闭/i.test(aria)
    );
  });
  return cancelOrClose;
}

function hasPasskeyPrompt(): boolean {
  return findPasskeyPromptButtons().length > 0;
}

function getPayPalLoginPhase(
  emailInput: HTMLInputElement | null,
  passwordInput: HTMLInputElement | null,
): '' | 'email' | 'password' | 'login_combined' {
  const emailNextButton = findEmailNextButton();
  const passwordLoginButton = findPasswordLoginButton();
  if (emailInput && emailNextButton && isEnabled(emailNextButton) && (!passwordInput || !passwordLoginButton)) {
    return 'email';
  }
  if (emailInput && passwordInput) return 'login_combined';
  if (passwordInput) return 'password';
  if (emailInput) return 'email';
  return '';
}

function findInputByPatterns(patterns: RegExp[]): HTMLInputElement | null {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
  return (
    inputs.find((input) => {
      if (!isVisible(input)) return false;
      const haystack = [input.id, input.name, input.placeholder, input.getAttribute('aria-label'), input.autocomplete]
        .filter(Boolean)
        .join(' ');
      return patterns.some((pattern) => pattern.test(haystack));
    }) || null
  );
}

function findClickableByText(patterns: RegExp[]): HTMLElement | null {
  const candidates = visibleControls('button, a, [role="button"], input[type="submit"]');
  return (
    candidates.find((el) => {
      const text = getActionText(el);
      return patterns.some((pattern) => pattern.test(text));
    }) || null
  );
}

// ============================================================
// 内部:输入与点击
// ============================================================

function refillPayPalEmail(emailInput: HTMLInputElement, email: string): void {
  try {
    emailInput.focus();
  } catch {
    /* ignore */
  }
  fillInputElement(emailInput, '');
  fillInputElement(emailInput, email);
  console.info(`${LOG_PREFIX} 已填写输入框 [login_email]`);
  try {
    emailInput.blur();
  } catch {
    /* ignore */
  }
}

function fillInputElement(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function simulateNativeClick(element: HTMLElement): void {
  try {
    element.scrollIntoView({ block: 'center', inline: 'center' });
  } catch {
    /* ignore */
  }
  const rect = element.getBoundingClientRect();
  const init: MouseEventInit & PointerEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    button: 0,
    buttons: 1,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    pointerId: 1,
    pointerType: 'mouse',
  };
  try {
    element.dispatchEvent(new PointerEvent('pointerdown', init));
  } catch {
    /* ignore */
  }
  element.dispatchEvent(new MouseEvent('mousedown', init));
  try {
    element.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 }));
  } catch {
    /* ignore */
  }
  element.dispatchEvent(new MouseEvent('mouseup', { ...init, buttons: 0 }));
  element.dispatchEvent(new MouseEvent('click', init));
  // 部分按钮(form 内 type=submit)直接 .click() 可触发 form submit,加一份保险
  try {
    (element as HTMLElement).click?.();
  } catch {
    /* ignore */
  }
}

// ============================================================
// 内部:工具
// ============================================================

function visibleControls(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isVisible);
}

function isVisible(element: Element | null): boolean {
  if (!element) return false;
  const html = element as HTMLElement;
  if ('disabled' in html && Boolean((html as HTMLInputElement).disabled)) return false;
  const style = window.getComputedStyle(html);
  if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
  const rect = html.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isEnabled(element: HTMLElement): boolean {
  if (!element) return false;
  const anyEl = element as HTMLButtonElement;
  if ('disabled' in anyEl && Boolean(anyEl.disabled)) return false;
  if (element.getAttribute('aria-disabled') === 'true') return false;
  return true;
}

function getActionText(el: HTMLElement): string {
  return normalizeText(el.textContent || el.getAttribute('aria-label') || el.getAttribute('value') || '');
}

function normalizeText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function waitFor<T>(predicate: () => T | null, timeoutMs: number): Promise<T | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = predicate();
    if (value) return value;
    await sleep(250);
  }
  return null;
}

async function waitForDocumentComplete(): Promise<void> {
  const start = Date.now();
  while (document.readyState !== 'complete') {
    if (Date.now() - start > 15000) break;
    await sleep(200);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
