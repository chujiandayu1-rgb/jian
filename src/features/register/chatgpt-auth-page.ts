import type { ActionResult } from './types';

const EMAIL_SELECTORS = [
  'input#email',
  'input[name="email"]',
  'input[type="email"]',
  'input[autocomplete="email"]',
];

const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'form button:not([type="button"])',
];

export function isChatGptLoginPage(): boolean {
  if (location.hostname !== 'chatgpt.com' && location.hostname !== 'auth.openai.com') {
    return false;
  }
  // Explicit login path
  if (location.pathname.startsWith('/auth/login')) {
    return true;
  }
  // Login modal on chatgpt.com main page — detect by presence of email input
  const emailInput = document.querySelector(
    'input#email, input[name="email"], input[type="email"], input[autocomplete="email"]',
  );
  if (emailInput && isVisible(emailInput)) {
    return true;
  }
  // auth.openai.com login page
  if (location.hostname === 'auth.openai.com' && document.querySelector('input[name="email"], input[type="email"]')) {
    return true;
  }
  return false;
}

function isVisible(element: Element): boolean {
  const el = element as HTMLElement;
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
}

export async function fillEmailAndContinue(email: string): Promise<ActionResult> {
  // ① 先尝试点击"创建账户 / Sign up / 注册"按钮（ChatGPT 首页默认显示登录，需要先切到注册）
  const signupClicked = await clickSignupButtonIfNeeded();
  if (signupClicked) {
    // 等待注册弹窗/页面渲染出邮箱输入框
    const emailAppeared = await waitForElement(EMAIL_SELECTORS, 5000);
    if (!emailAppeared) {
      return fail('点击了创建账户但邮箱输入框未出现');
    }
  }

  // ② 如果当前页面默认是手机号输入模式，先点击"继续使用电子邮件地址"切换到邮箱模式
  await clickSwitchToEmailIfNeeded();

  // ③ 等待邮箱输入框出现
  const input = await waitForElement(EMAIL_SELECTORS, 3000) as HTMLInputElement | null;
  if (!input) {
    return fail('没有找到邮箱输入框');
  }

  // ④ 用 React 兼容方式填入邮箱
  input.focus();
  await waitMs(100);
  setNativeValue(input, email);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  await waitMs(500);

  // ⑤ 等待"继续"按钮变 enabled 再点击
  const button = findSubmitButton();
  if (!button) {
    return fail('没有找到继续按钮');
  }

  if (button.disabled) {
    await waitForEnabled(button, 5000);
  }

  if (button.disabled) {
    return fail('继续按钮仍然不可点击');
  }

  simulateNativeClick(button);
  return ok('已填入邮箱并点击继续');
}

/**
 * 在 chatgpt.com 首页，如果当前不在注册/邮箱输入状态，先点击"创建账户"按钮。
 * 返回 true 表示确实点击了。
 */
async function clickSignupButtonIfNeeded(): Promise<boolean> {
  // 如果已经有邮箱输入框了，不需要点击
  const existingInput = findFirst<HTMLInputElement>(EMAIL_SELECTORS);
  if (existingInput && isVisible(existingInput)) {
    return false;
  }

  // 找"创建账户 / Sign up / 注册 / Create account" 按钮
  const signupButton = findButtonByText([
    /创建账[户号]/,
    /注册/,
    /sign\s*up/i,
    /create\s*(an?\s*)?account/i,
    /get\s*started/i,
  ]);

  if (!signupButton) {
    return false;
  }

  simulateNativeClick(signupButton);
  await waitMs(1500);
  return true;
}

/**
 * OpenAI 注册弹窗有时默认显示手机号输入，需要点击"继续使用电子邮件地址"切换
 */
async function clickSwitchToEmailIfNeeded(): Promise<void> {
  const switchButton = findButtonByText([
    /继续使用(?:电子)?邮件(?:地址)?/,
    /改用邮箱/,
    /use\s+(?:an?\s+)?email/i,
    /continue\s+(?:with\s+)?email/i,
  ]);

  if (switchButton) {
    simulateNativeClick(switchButton);
    await waitMs(1000);
  }
}

/**
 * 按文本模式找可点击按钮/链接
 */
function findButtonByText(patterns: RegExp[]): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('button, a, [role="button"], [role="link"]'),
  ).filter(isVisible);

  return candidates.find((el) => {
    const text = (el.textContent || '').trim();
    return patterns.some((pattern) => pattern.test(text));
  }) ?? null;
}

/**
 * 等待某组 selector 中任意一个元素出现并可见
 */
async function waitForElement(selectors: string[], timeoutMs: number): Promise<Element | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isVisible(el)) {
        return el;
      }
    }
    await waitMs(250);
  }
  return null;
}

/**
 * 用完整 PointerEvent 链点击（React/Stripe 页面需要这种方式）
 */
function simulateNativeClick(element: HTMLElement): void {
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
  try { element.dispatchEvent(new PointerEvent('pointerdown', init)); } catch { /* ignore */ }
  element.dispatchEvent(new MouseEvent('mousedown', init));
  try { element.dispatchEvent(new PointerEvent('pointerup', { ...init, buttons: 0 })); } catch { /* ignore */ }
  element.dispatchEvent(new MouseEvent('mouseup', { ...init, buttons: 0 }));
  element.dispatchEvent(new MouseEvent('click', init));
  element.click();
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function findSubmitButton(): HTMLButtonElement | null {
  for (const selector of SUBMIT_SELECTORS) {
    const button = document.querySelector<HTMLButtonElement>(selector);
    if (button) {
      return button;
    }
  }

  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
    const text = (button.textContent || '').trim();
    return text === '继续' || text.toLowerCase() === 'continue';
  }) ?? null;
}

function findFirst<T extends Element>(selectors: string[]): T | null {
  for (const selector of selectors) {
    const element = document.querySelector<T>(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

function setNativeValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
}

function waitForEnabled(button: HTMLButtonElement, timeoutMs: number): Promise<void> {
  const started = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      if (!button.disabled || Date.now() - started >= timeoutMs) {
        resolve();
        return;
      }
      window.setTimeout(check, 100);
    };
    check();
  });
}

function ok(message: string): ActionResult {
  return { ok: true, message };
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}
