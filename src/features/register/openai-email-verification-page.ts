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

  // 使用 React 兼容的方式输入（execCommand insertText 模拟真实键盘）
  await fillInputLikeUser(input, normalized);
  await waitMs(200);

  // 验证值是否真的填进去了
  if (!input.value) {
    return fail('验证码未写入输入框（React 框架兼容问题）');
  }

  const button = findContinueButton();
  if (!button) {
    return fail('没有找到验证码继续按钮');
  }

  if (button.disabled) {
    await waitForEnabled(button, 3000);
  }

  if (button.disabled) {
    return fail('验证码继续按钮仍然不可点击');
  }

  // 双保险：先 click，再对输入框模拟 Enter（部分时候 React 表单要靠 Enter 提交）
  button.click();

  // 等一小会让 React 处理 click
  await waitMs(150);

  // 如果还在原页面（说明 click 没触发表单提交），追加 Enter
  if (location.pathname.startsWith('/email-verification')) {
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));

    const form = input.closest('form');
    if (form) {
      const requestSubmit = (form as HTMLFormElement).requestSubmit?.bind(form);
      try {
        if (requestSubmit) {
          requestSubmit();
        }
      } catch {
        // ignore
      }
    }
  }

  return ok('已填入验证码并点击继续');
}

async function fillInputLikeUser(input: HTMLInputElement, value: string): Promise<void> {
  // 聚焦
  input.focus();
  input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  await waitMs(100);

  // 清空已有内容
  input.select();
  document.execCommand('selectAll');
  document.execCommand('delete');
  await waitMs(50);

  // 方法1：使用 execCommand insertText（对 React 兼容性最好）
  const inserted = document.execCommand('insertText', false, value);

  if (!inserted || input.value !== value) {
    // 方法2：如果 execCommand 不行，用 native value setter + InputEvent
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(input),
      'value',
    )?.set || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }

    // React 16+ 需要这个特殊的 InputEvent
    input.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: value,
    }));
  }

  await waitMs(100);

  // 触发 change（注意：不要立即 blur，可能会让 React 校验前清空）
  input.dispatchEvent(new Event('change', { bubbles: true }));
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
