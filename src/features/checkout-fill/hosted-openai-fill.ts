// pay.openai.com (Stripe hosted) 自动填写 + 选 PayPal + 提交订阅
// 完全照搬 GuJumpgate content/plus-checkout.js 的 runHostedOpenAiCheckoutStep 实现思路:
//   1) MutationObserver 持续隐藏 Google Places 自动补全(.AddressAutocomplete-results / .pac-container)
//   2) 双击 PayPal 单选(第一次 React 不一定切换)
//   3) 国家选 US / 街道 / 城市 / 邮编 / 州 按固定 id 填(用 React 兼容 setter)
//   4) 勾"同意条款" checkbox(termsOfServiceConsentCheckbox)
//   5) 反复 10 次每次 sleep 300ms 把自动补全压住
//   6) 用完整 PointerEvent + MouseEvent 链点击"订阅"按钮
//   7) 提交按钮重试 10 次,等到 !disabled && rect.height > 0 && (text 变 processing 或换文案)

import type { AddressProfile } from '../address-autofill/types';

const LOG_PREFIX = '[OPX HostedFill]';

const AUTOCOMPLETE_SELECTORS = [
  '.AddressAutocomplete-results',
  '[class*="AddressAutocomplete"]',
  '#billing-address-autocomplete-results',
  '.pac-container',
];

let autocompleteObserver: MutationObserver | null = null;

export interface HostedFillResult {
  ok: boolean;
  filled: number;
  message: string;
  clicked: boolean;
  verificationPopupVisible: boolean;
}

export function isHostedOpenAiCheckoutPage(): boolean {
  const host = String(location?.host || '').toLowerCase();
  return host.includes('pay.openai.com') || host.includes('checkout.stripe.com');
}

export async function runHostedOpenAiCheckoutFill(address: AddressProfile): Promise<HostedFillResult> {
  if (!isHostedOpenAiCheckoutPage()) {
    return { ok: false, filled: 0, message: '当前不是 pay.openai.com / Stripe hosted 页面', clicked: false, verificationPopupVisible: false };
  }

  await waitForDocumentComplete();

  // ① 持续隐藏 Google 地址自动补全弹窗(它会挡住"订阅"按钮)
  startAutocompleteObserver();
  hideAutocomplete();
  removeCaptcha();

  // ② 双击 PayPal 单选(第一次 React 不一定切换)
  await sleep(2000);
  const payPalButton = findPayPalButton();
  if (payPalButton) {
    simulateNativeClick(payPalButton);
    await sleep(500);
    simulateNativeClick(payPalButton);
    console.info(`${LOG_PREFIX} clicked PayPal twice`);
  } else {
    console.warn(`${LOG_PREFIX} PayPal accordion button not found`);
  }

  // ③ 等 PayPal 选中后表单字段渲染出来
  await sleep(3000);

  let filled = 0;

  // ④ 国家下拉:必须先选国家,州/邮编校验才会启用
  const countrySelect = findCountryDropdown();
  if (countrySelect) {
    if (selectCountryOption(countrySelect, address.countryCode || 'US')) {
      filled += 1;
    }
    await sleep(550);
  }

  // ⑤ 按固定 id 填地址
  if (fillInputBySelector('#billingAddressLine1', address.line1)) filled += 1;
  hideAutocomplete();
  await sleep(300);
  if (fillInputBySelector('#billingAddressLine2', address.line2)) filled += 1;
  if (fillInputBySelector('#billingLocality', address.city)) filled += 1;
  if (fillInputBySelector('#billingPostalCode', address.postalCode)) filled += 1;
  if (fillSelectByIdText('billingAdministrativeArea', address.stateFull || address.state)) filled += 1;

  // 联系信息(姓名 + 电话)— pay.openai 顶部有 #billingName / #email / #phoneNumber
  if (fillInputBySelector('#billingName', address.fullName)) filled += 1;
  if (fillInputBySelector('#phoneNumber', address.phone)) filled += 1;

  // ⑥ 勾选"我同意以下条款"
  const checkbox = document.getElementById('termsOfServiceConsentCheckbox') as HTMLInputElement | null;
  if (checkbox && !checkbox.checked) {
    simulateNativeClick(checkbox);
    filled += 1;
  }

  // ⑦ 反复 10 次把自动补全压住(输入会重新触发它)
  (document.activeElement as HTMLElement | null)?.blur?.();
  for (let i = 0; i < 10; i += 1) {
    hideAutocomplete();
    await sleep(300);
  }

  // ⑧ 等 3.5s 让"订阅"按钮变 enabled,再点击(内部会重试 10 次)
  await sleep(3500);
  const clickResult = await clickHostedSubmitButton(0);

  return {
    ok: filled > 0 || clickResult.clicked,
    filled,
    clicked: clickResult.clicked,
    verificationPopupVisible: clickResult.verificationPopupVisible,
    message: clickResult.clicked
      ? `已填 ${filled} 项并点击订阅`
      : filled > 0
        ? `已填 ${filled} 项,但订阅按钮未点击成功`
        : '未填到任何字段',
  };
}

// 当 pay.openai 弹出短信验证码弹窗时(#ci-ciBasic-0 ~ ci-ciBasic-5),把 6 位码塞进去
export async function fillHostedOpenAiVerificationCode(verificationCode: string): Promise<{ ok: boolean; message: string }> {
  const code = String(verificationCode || '').replace(/\D+/g, '').slice(0, 6);
  if (code.length !== 6) {
    return { ok: false, message: 'pay.openai 验证码不是 6 位' };
  }
  for (let index = 0; index < 6; index += 1) {
    const input = document.getElementById(`ci-ciBasic-${index}`) as HTMLInputElement | null;
    if (!input) {
      return { ok: false, message: 'pay.openai 验证码弹窗未渲染完整' };
    }
    fillInputElement(input, code[index] || '');
  }
  return { ok: true, message: 'pay.openai 验证码已填入' };
}

export function hasHostedVerificationPopup(): boolean {
  return Boolean(document.getElementById('ci-ciBasic-0'));
}

// ============================================================
// 内部实现
// ============================================================

function findPayPalButton(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('[data-testid="paypal-accordion-item-button"]') ||
    document.querySelector<HTMLElement>('.paypal-accordion-item button') ||
    document.querySelector<HTMLElement>('#payment-method-label-paypal') ||
    document.querySelector<HTMLElement>('button[aria-label*="PayPal" i]')
  );
}

function findCountryDropdown(): HTMLSelectElement | null {
  return (
    document.querySelector<HTMLSelectElement>('#billingCountry') ||
    document.querySelector<HTMLSelectElement>('select[name="billingCountry"]') ||
    document.querySelector<HTMLSelectElement>('select[autocomplete="billing country"]')
  );
}

function findHostedSubmitButton(): HTMLButtonElement | null {
  const direct =
    document.querySelector<HTMLButtonElement>('button[data-testid="submit-button"]') ||
    document.querySelector<HTMLButtonElement>('button[data-testid="hosted-payment-submit-button"]') ||
    document.querySelector<HTMLButtonElement>('button[data-atomic-wait-intent="Submit_Email"]') ||
    document.querySelector<HTMLButtonElement>('button.SubmitButton--complete');
  if (direct) {
    return direct;
  }

  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  return (
    buttons.find((button) => {
      const text = normalizeText(button.textContent || '');
      return (
        text === '下一页' ||
        text === '订阅' ||
        text === 'Subscribe' ||
        text === 'Next' ||
        text === 'Pay' ||
        text === 'Continue' ||
        text === 'Agree' ||
        text.toLowerCase().includes('subscribe') ||
        text.toLowerCase().includes('start trial')
      );
    }) || null
  );
}

async function clickHostedSubmitButton(retries: number): Promise<{ clicked: boolean; verificationPopupVisible: boolean; buttonText: string }> {
  if (hasCaptcha()) {
    removeCaptcha();
  }
  const button = findHostedSubmitButton();
  if (!button) {
    if (retries >= 10) {
      return { clicked: false, verificationPopupVisible: false, buttonText: '' };
    }
    await sleep(1000);
    return clickHostedSubmitButton(retries + 1);
  }

  const buttonText = normalizeText(button.textContent || '');

  if (button.disabled) {
    if (retries >= 10) {
      return { clicked: false, verificationPopupVisible: false, buttonText };
    }
    await sleep(1000);
    return clickHostedSubmitButton(retries + 1);
  }

  const rect = button.getBoundingClientRect();
  if (rect.height === 0) {
    if (retries >= 10) {
      return { clicked: false, verificationPopupVisible: false, buttonText };
    }
    await sleep(1000);
    return clickHostedSubmitButton(retries + 1);
  }

  stopAutocompleteObserver();
  hideAutocomplete();
  (document.activeElement as HTMLElement | null)?.blur?.();
  simulateNativeClick(button);
  await sleep(1000);

  startAutocompleteObserver();
  hideAutocomplete();
  if (hasCaptcha()) {
    removeCaptcha();
  }
  if (hasHostedVerificationPopup()) {
    return { clicked: true, verificationPopupVisible: true, buttonText };
  }

  // 按钮文字未变 + 没有 processing → 可能没真点中,重试
  const currentText = normalizeText(button.textContent || '');
  if (!/processing/i.test(currentText) && currentText === buttonText) {
    if (retries >= 10) {
      return { clicked: true, verificationPopupVisible: false, buttonText };
    }
    await sleep(2000);
    return clickHostedSubmitButton(retries + 1);
  }

  return { clicked: true, verificationPopupVisible: false, buttonText };
}

// React 兼容的 input 写入(原生 setter + input/change 事件)
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

function fillInputBySelector(selector: string, value: string): boolean {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) return false;
  if (input.value === trimmed) return false;
  fillInputElement(input, trimmed);
  return true;
}

function fillSelectByIdText(id: string, expected: string): boolean {
  const select = document.getElementById(id) as HTMLSelectElement | null;
  const needle = normalizeText(expected);
  if (!select || !needle) return false;

  const match = Array.from(select.options || []).find((option) => {
    const optionText = normalizeText(option?.textContent || option?.label || '');
    const optionValue = normalizeText(option?.value || '');
    return (
      optionText.toLowerCase().includes(needle.toLowerCase()) ||
      optionValue.toLowerCase().includes(needle.toLowerCase())
    );
  });
  if (!match || select.value === match.value) return false;
  select.value = match.value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

function selectCountryOption(select: HTMLSelectElement, countryCode: string): boolean {
  const code = String(countryCode || '').trim().toUpperCase();
  if (!code) return false;
  const match = Array.from(select.options).find(
    (option) => option.value.toUpperCase() === code || normalizeText(option.textContent).toUpperCase() === code,
  );
  if (!match || select.value === match.value) return false;
  select.value = match.value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

// 用完整事件链点击(单纯 .click() 在 Stripe 上经常没反应)
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
}

function hideAutocomplete(): void {
  const elements = document.querySelectorAll<HTMLElement>(AUTOCOMPLETE_SELECTORS.join(', '));
  elements.forEach((node) => {
    try {
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      node.style.setProperty('height', '0', 'important');
      node.style.setProperty('overflow', 'hidden', 'important');
    } catch {
      /* ignore readonly style failures */
    }
  });
}

function startAutocompleteObserver(): void {
  if (autocompleteObserver || !isHostedOpenAiCheckoutPage()) return;
  autocompleteObserver = new MutationObserver(() => hideAutocomplete());
  autocompleteObserver.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
  });
}

function stopAutocompleteObserver(): void {
  if (!autocompleteObserver) return;
  autocompleteObserver.disconnect();
  autocompleteObserver = null;
}

function hasCaptcha(): boolean {
  return Boolean(
    document.querySelector('iframe[name="recaptcha"]') ||
      document.getElementById('captchaHeading') ||
      document.querySelector('#captcha-standalone') ||
      document.querySelector('form[action="/auth/validatecaptcha"]'),
  );
}

function removeCaptcha(): void {
  const selectors = ['#captcha-standalone', '.captcha-overlay', '.captcha-container'];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      try {
        node.remove();
      } catch {
        /* ignore */
      }
    });
  });
}

async function waitForDocumentComplete(): Promise<void> {
  const start = Date.now();
  while (document.readyState !== 'complete') {
    if (Date.now() - start > 15000) break;
    await sleep(200);
  }
  await sleep(1000);
}

function normalizeText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
