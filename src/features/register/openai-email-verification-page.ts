import type { ActionResult } from './types';

const OTP_SELECTORS = [
  'input[name="code"]',
  'input[name="otp"]',
  'input[autocomplete="one-time-code"]',
  'input[inputmode="numeric"]',
  'input[type="text"]',
];

export function isEmailVerificationPage(): boolean {
  if (location.hostname !== 'auth.openai.com' || !location.pathname.startsWith('/email-verification')) {
    return false;
  }
  // 如果页面已经显示"已验证"，不再认为是验证码输入页
  const bodyText = (document.body?.textContent || '').toLowerCase();
  if (bodyText.includes('已验证') || bodyText.includes('verified') || bodyText.includes('email verified')) {
    return false;
  }
  return true;
}

export async function fillOtpAndContinue(code: string): Promise<ActionResult> {
  const normalized = code.replace(/\D/g, '');
  if (!normalized) {
    return fail('验证码不能为空');
  }

  const input = findOtpInput();
  if (!input) {
    return fail('没有找到验证码输入框');
  }

  // 关键修复：用 HTMLInputElement.prototype 上的原生 setter（绕过 React 的受控组件 wrapper）
  // 这是 React 表单的标准 hack：让 React 检测到值变了并重新跑 onChange
  setNativeValue(input, normalized);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  // 等 React 一个渲染周期，按钮 disabled 状态会被解除
  await waitMs(60);

  const button = findContinueButton();
  if (!button) {
    return fail('没有找到验证码继续按钮');
  }

  if (button.disabled) {
    await waitForEnabled(button, 2500);
  }

  if (button.disabled) {
    return fail('验证码继续按钮仍然不可点击');
  }

  button.click();

  // 兜底：等 150ms 看页面有没有跳走，没跳走就模拟 Enter + form.requestSubmit
  await waitMs(150);
  if (location.pathname.startsWith('/email-verification')) {
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));

    const form = input.closest('form');
    if (form) {
      try {
        (form as HTMLFormElement).requestSubmit?.();
      } catch {
        // ignore
      }
    }
  }

  return ok('已填入验证码并点击继续');
}

// 对方版本同款的 setNativeValue：用 HTMLInputElement.prototype 而不是 getPrototypeOf(input)
// 后者在 React 受控组件下会拿到 React 包过的 setter，导致值看似填进去了但 React 不认。
function setNativeValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function findOtpInput(): HTMLInputElement | null {
  for (const selector of OTP_SELECTORS) {
    const input = document.querySelector<HTMLInputElement>(selector);
    if (input) {
      return input;
    }
  }

  const candidates = Array.from(document.querySelectorAll<HTMLInputElement>('input'));
  return candidates.find((input) => {
    const label = [
      input.placeholder,
      input.ariaLabel,
      input.name,
      input.id,
    ].join(' ').toLowerCase();
    return label.includes('code') || label.includes('otp') || label.includes('验证');
  }) ?? null;
}

function findContinueButton(): HTMLButtonElement | null {
  const submit = document.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) {
    return submit;
  }

  return Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
    const text = (button.textContent || '').trim();
    return text === '继续' || text.toLowerCase() === 'continue';
  }) ?? null;
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
