import { isOrchestratorPaused } from '../auto-orchestrator/orchestrator';
import { loadAddressAutofillSettings, saveAddressAutofillSettings } from '../settings/state';
import type { AddressAutofillSettings } from '../settings/types';
import type { AddressProfile, RandomAddressResponse } from './types';

const LOG_PREFIX = '[OPX Pay Autofill]';
const PAYPAL_SELECTORS = [
  '[data-testid="paypal-accordion-item"]',
  '#payment-method-accordion-item-title-paypal',
  'button[data-testid="paypal-accordion-item-button"]',
  'button[aria-label*="PayPal"]',
  'button[aria-label*="paypal" i]',
];

let initialized = false;
let running = false;
let scheduledTimer: number | null = null;
let pageAddress: AddressProfile | null = null;
let pageAddressScope = '';

export function initPayOpenAiAddressAutofill(): void {
  if (initialized || location.hostname !== 'pay.openai.com') {
    return;
  }

  initialized = true;
  installStorageListener();
  installObserver();
  scheduleAutofill(800);
}

async function runAutofill(): Promise<void> {
  if (running) {
    return;
  }

  running = true;
  try {
    if (await isOrchestratorPaused()) {
      console.info(`${LOG_PREFIX} paused by orchestrator`);
      return;
    }
    const settings = await loadAddressAutofillSettings();
    if (!settings.payOpenAiEnabled) {
      console.info(`${LOG_PREFIX} disabled`);
      return;
    }

    const address = await getPageAddress(settings);
    if (!address) {
      console.info(`${LOG_PREFIX} no address available`);
      return;
    }

    const result = await fillPayOpenAiAddressNow(address);
    console.info(`${LOG_PREFIX} ${result.message}`, {
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.countryCode,
      source: address.source,
    });
  } catch (error) {
    console.warn(`${LOG_PREFIX} failed`, error);
  } finally {
    running = false;
  }
}

export async function fillPayOpenAiAddressNow(address: AddressProfile): Promise<{ ok: boolean; filled: number; message: string }> {
  if (location.hostname !== 'pay.openai.com') {
    return { ok: false, filled: 0, message: '当前不是 pay.openai.com 页面' };
  }

  selectPaypalIfPresent();
  await delay(450);

  // 选择 PayPal 后等待地址表单出现
  await waitForAddressForm(3000);

  const filled = await fillCheckoutFields(address);
  return {
    ok: filled > 0,
    filled,
    message: filled > 0 ? `已填写 OpenAI 支付页 ${filled} 项` : '未找到可填写的 OpenAI 支付字段',
  };
}

async function getPageAddress(settings: AddressAutofillSettings): Promise<AddressProfile | null> {
  const scope = `${settings.countryCode}|${settings.city}`;
  if (pageAddress && pageAddressScope === scope) {
    return pageAddress;
  }

  pageAddress = await fetchAndStoreAddress(settings);
  pageAddressScope = scope;
  return pageAddress;
}

async function fetchAndStoreAddress(settings: AddressAutofillSettings): Promise<AddressProfile | null> {
  const response = await browser.runtime.sendMessage({
    type: 'opx:fetch-random-address',
    countryCode: settings.countryCode,
    city: settings.city,
  });

  if (!isRandomAddressResponse(response) || !response.ok || !response.address) {
    console.warn(`${LOG_PREFIX} address fetch failed`, response);
    return null;
  }

  await saveAddressAutofillSettings({ lastAddress: response.address });
  return response.address;
}

async function fillCheckoutFields(address: AddressProfile): Promise<number> {
  let filled = 0;

  filled += fillInput('#billingName', address.fullName, true);
  filled += fillSelect('#billingCountry', address.countryCode, [address.countryLabel, address.countryCode]);

  if (document.querySelector('#billingCountry')) {
    await delay(550);
  }

  filled += fillInput('#billingAddressLine1', address.line1, true);
  // 关闭 Google 地址建议下拉（填入地址后可能弹出）
  dismissAutocompleteDropdown();
  await delay(300);

  filled += fillInput('#billingAddressLine2', address.line2, true);
  filled += fillInput('#billingLocality', address.city, true);
  filled += fillSelectOrInput('#billingAdministrativeArea', address.state, [address.stateFull, address.state]);
  filled += fillInput('#billingPostalCode', address.postalCode, true);
  filled += fillInput('#phoneNumber', address.phone, false);

  filled += fillByAutocomplete('billing address-line1', address.line1);
  dismissAutocompleteDropdown();
  await delay(300);

  filled += fillByAutocomplete('billing address-line2', address.line2);
  filled += fillByAutocomplete('billing address-level2', address.city);
  filled += fillByAutocomplete('billing postal-code', address.postalCode);
  filled += fillSelectOrInputByAutocomplete('billing address-level1', address.state, [address.stateFull, address.state]);
  filled += fillSelectByAutocomplete('billing country', address.countryCode, [address.countryLabel, address.countryCode]);
  filled += checkVisibleTermsCheckboxes();

  return filled;
}

function selectPaypalIfPresent(): boolean {
  // 检查 PayPal radio 是否已选中
  const paypalRadio = document.querySelector<HTMLInputElement>('#payment-method-accordion-item-title-paypal');
  if (paypalRadio?.checked || paypalRadio?.getAttribute('aria-checked') === 'true') {
    return true;
  }

  // ✅ 经实测：在 Stripe 的 PayPal 选项上，直接对 label div 派发完整指针事件最可靠
  const paypalLabel = document.querySelector<HTMLElement>('#payment-method-label-paypal');
  if (paypalLabel && isVisible(paypalLabel)) {
    clickElement(paypalLabel);
    console.info(`${LOG_PREFIX} 已点击 PayPal label`);
    return true;
  }

  // 备选：点击 paypal-accordion-item-button
  const paypalButton = document.querySelector<HTMLElement>('button[data-testid="paypal-accordion-item-button"]');
  if (paypalButton && isVisible(paypalButton)) {
    clickElement(paypalButton);
    console.info(`${LOG_PREFIX} 已点击 PayPal button`);
    return true;
  }

  // 备选：点击 radio 的可点击祖先
  if (paypalRadio) {
    const wrapper = paypalRadio.closest('.PaymentMethodFormAccordionItemTitle, .flex-container.direction-row.align-items-center, label, [role="radio"]') as HTMLElement | null;
    if (wrapper && isVisible(wrapper)) {
      clickElement(wrapper);
      console.info(`${LOG_PREFIX} 已点击 PayPal radio 容器`);
      return true;
    }
    clickElement(paypalRadio);
    console.info(`${LOG_PREFIX} 已点击 PayPal radio`);
    return true;
  }

  // 最后回退：通过文本匹配
  const textMatch = Array.from(document.querySelectorAll<HTMLElement>('div, span, label'))
    .filter(isVisible)
    .find((element) => {
      const text = normalizedText(element.textContent);
      return text === 'paypal';
    });

  if (textMatch) {
    clickElement(textMatch);
    console.info(`${LOG_PREFIX} 通过文本匹配点击了 PayPal`);
    return true;
  }

  console.warn(`${LOG_PREFIX} 未找到 PayPal 选项`);
  return false;
}

function fillInput(selector: string, value: string, overwrite: boolean): number {
  if (!value) {
    return 0;
  }
  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!isTextControl(input) || !isVisible(input) || isSensitivePaymentField(input)) {
    return 0;
  }
  if (!overwrite && input.value.trim()) {
    return 0;
  }
  if (input.value === value) {
    return 0;
  }
  setNativeValue(input, value);
  return 1;
}

function fillByAutocomplete(autocomplete: string, value: string): number {
  const selector = `input[autocomplete="${cssEscape(autocomplete)}"], textarea[autocomplete="${cssEscape(autocomplete)}"]`;
  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!isTextControl(input) || !isVisible(input) || input.value === value || isSensitivePaymentField(input)) {
    return 0;
  }
  setNativeValue(input, value);
  return 1;
}

function fillSelect(selector: string, preferredValue: string, preferredLabels: string[]): number {
  const select = document.querySelector<HTMLSelectElement>(selector);
  if (!isSelectControl(select) || !isVisible(select)) {
    return 0;
  }
  return setSelectOption(select, preferredValue, preferredLabels);
}

function fillSelectByAutocomplete(autocomplete: string, preferredValue: string, preferredLabels: string[]): number {
  const select = document.querySelector<HTMLSelectElement>(`select[autocomplete="${cssEscape(autocomplete)}"]`);
  if (!isSelectControl(select) || !isVisible(select)) {
    return 0;
  }
  return setSelectOption(select, preferredValue, preferredLabels);
}

function fillSelectOrInput(selector: string, preferredValue: string, preferredLabels: string[]): number {
  const element = document.querySelector(selector);
  if (isSelectControl(element)) {
    return isVisible(element) ? setSelectOption(element, preferredValue, preferredLabels) : 0;
  }
  if (isTextControl(element)) {
    return fillInput(selector, preferredValue, true);
  }
  return 0;
}

function fillSelectOrInputByAutocomplete(autocomplete: string, preferredValue: string, preferredLabels: string[]): number {
  const select = document.querySelector(`select[autocomplete="${cssEscape(autocomplete)}"]`);
  if (isSelectControl(select)) {
    return isVisible(select) ? setSelectOption(select, preferredValue, preferredLabels) : 0;
  }
  return fillByAutocomplete(autocomplete, preferredValue || preferredLabels[0] || '');
}

function setSelectOption(select: HTMLSelectElement, preferredValue: string, preferredLabels: string[]): number {
  const options = Array.from(select.options).filter((option) => !option.disabled && option.value);
  const normalizedPreferred = normalizedText(preferredValue);
  const labelNeedles = preferredLabels.map((label) => normalizedText(label)).filter(Boolean);
  const option = options.find((item) => normalizedText(item.value) === normalizedPreferred) ||
    options.find((item) => labelNeedles.some((needle) => normalizedText(`${item.text} ${item.value}`).includes(needle)));

  if (!option || select.value === option.value) {
    return 0;
  }

  select.value = option.value;
  emitChange(select);
  return 1;
}

function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }
  emitChange(input);
}

function checkVisibleTermsCheckboxes(): number {
  let checked = 0;
  const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    .filter(isVisible)
    .filter((checkbox) => !checkbox.checked)
    .filter((checkbox) => {
      const text = normalizedText([
        checkbox.id,
        checkbox.name,
        checkbox.getAttribute('aria-label'),
        checkbox.closest('label')?.textContent,
        checkbox.parentElement?.textContent,
      ].join(' '));
      return text.includes('terms') ||
        text.includes('consent') ||
        text.includes('使用条款') ||
        text.includes('隐私政策') ||
        text.includes('取消') ||
        checkbox.id === 'termsOfServiceConsentCheckbox';
    });

  for (const checkbox of checkboxes) {
    checkbox.click();
    checked += 1;
  }

  return checked;
}

function emitChange(element: HTMLElement): void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

function clickElement(element: HTMLElement): void {
  element.scrollIntoView({ block: 'center', inline: 'center' });
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
    const EventCtor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
    element.dispatchEvent(new EventCtor(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: type.endsWith('down') ? 1 : 0,
      pointerId: 1,
      pointerType: 'mouse',
    }));
  }
  element.click();
}

function installObserver(): void {
  const observer = new MutationObserver(() => scheduleAutofill(250));
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function installStorageListener(): void {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    if (Object.keys(changes).some((key) => key.includes('settings'))) {
      pageAddress = null;
      pageAddressScope = '';
      scheduleAutofill(100);
    }
  });
}

function scheduleAutofill(delayMs: number): void {
  if (scheduledTimer) {
    window.clearTimeout(scheduledTimer);
  }
  scheduledTimer = window.setTimeout(() => {
    scheduledTimer = null;
    void runAutofill();
  }, delayMs);
}

function isVisible(element: Element): boolean {
  const htmlElement = element as HTMLElement;
  if ('disabled' in htmlElement && Boolean((htmlElement as HTMLInputElement).disabled)) {
    return false;
  }
  const style = window.getComputedStyle(htmlElement);
  const rect = htmlElement.getBoundingClientRect();
  return style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    rect.width > 0 &&
    rect.height > 0;
}

function isSensitivePaymentField(element: Element): boolean {
  const haystack = normalizedText([
    element.getAttribute('aria-label'),
    element.getAttribute('placeholder'),
    element.getAttribute('autocomplete'),
    element.getAttribute('name'),
    element.getAttribute('id'),
  ].join(' '));

  return [
    'cc-number',
    'card number',
    'credit card',
    'security code',
    'cvc',
    'cvv',
    'expiry',
    'expiration',
  ].some((needle) => haystack.includes(needle));
}

function isTextControl(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement {
  return Boolean(element && (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement));
}

function isSelectControl(element: Element | null): element is HTMLSelectElement {
  return Boolean(element && element instanceof HTMLSelectElement);
}

function normalizedText(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/"/g, '\\"');
}

function dismissAutocompleteDropdown(): void {
  // 按 Escape 关闭 Google 地址建议下拉
  const activeElement = document.activeElement as HTMLElement | null;
  if (activeElement) {
    activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    activeElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
    activeElement.blur();
  }

  // 也尝试隐藏/移除 Google Places 下拉容器
  const pacContainers = document.querySelectorAll<HTMLElement>('.pac-container');
  for (const container of Array.from(pacContainers)) {
    container.style.display = 'none';
  }

  // 点击 "手动输入地址" 链接（如果有的话）
  const manualLinks = document.querySelectorAll<HTMLElement>('a, button, span, div');
  for (const el of Array.from(manualLinks)) {
    const text = normalizedText(el.textContent || '');
    if (text.includes('enter address manually') || text.includes('手动输入地址') || text.includes('manual')) {
      if (isVisible(el)) {
        el.click();
        break;
      }
    }
  }
}

async function waitForAddressForm(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  const selectors = [
    '#billingName',
    '#billingAddressLine1',
    '#billingCountry',
    'input[autocomplete="billing address-line1"]',
    'input[name="billingName"]',
  ];

  while (Date.now() < deadline) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && isVisible(el)) {
        return true;
      }
    }
    await delay(300);
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRandomAddressResponse(value: unknown): value is RandomAddressResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as RandomAddressResponse).ok === 'boolean' &&
      typeof (value as RandomAddressResponse).message === 'string',
  );
}
