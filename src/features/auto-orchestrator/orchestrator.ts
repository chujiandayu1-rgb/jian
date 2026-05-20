import { loadRegisterState, saveRegisterState, loadLinkExtractorState, loadSmsRelayState } from '../../app/state';
import { createRegisterController } from '../register/controller';
import { isChatGptLoginPage } from '../register/chatgpt-auth-page';
import { isEmailVerificationPage } from '../register/openai-email-verification-page';
import { isAboutYouPage } from '../register/openai-about-you-page';
import { fillPayOpenAiAddressNow } from '../address-autofill/pay-openai-autofill';
import { fetchSmsRelayCode } from '../sms/poller';
import type { OrchestratorState, OrchestratorStep } from './types';
import type { CheckoutLinkResponse, ChatGptSessionResponse } from '../link-extractor/types';
import type { SmsRelayTarget } from '../sms/types';

const STORAGE_KEY = 'opx.orchestrator.state';
const LOG_PREFIX = '[OPX Auto]';
const POLL_INTERVAL_MS = 2000;
const SMS_POLL_INTERVAL_MS = 5000;
const SMS_TIMEOUT_MS = 180_000;

let running = false;
let pollTimer: number | null = null;
let listeners: Array<(state: OrchestratorState) => void> = [];

const DEFAULT_STATE: OrchestratorState = {
  enabled: false,
  paused: false,
  currentStep: 'idle',
  statusMessage: '等待开始',
  startedAt: 0,
  completedSteps: [],
  lastError: '',
  generatedLink: '',
  updatedAt: 0,
};

export function onOrchestratorStateChange(fn: (state: OrchestratorState) => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((item) => item !== fn);
  };
}

export async function loadOrchestratorState(): Promise<OrchestratorState> {
  const data = await browser.storage.local.get(STORAGE_KEY);
  return normalizeState(data[STORAGE_KEY]);
}

export async function saveOrchestratorState(patch: Partial<OrchestratorState>): Promise<OrchestratorState> {
  const current = await loadOrchestratorState();
  const next = normalizeState({ ...current, ...patch, updatedAt: Date.now() });
  await browser.storage.local.set({ [STORAGE_KEY]: next });
  notifyListeners(next);
  return next;
}

export async function startOrchestrator(): Promise<void> {
  const registerState = await loadRegisterState();
  if (!registerState.rawInput.trim()) {
    await saveOrchestratorState({
      enabled: false,
      paused: false,
      currentStep: 'error',
      lastError: '请先在注册 tab 输入 Outlook 账号行',
      statusMessage: '请先输入账号',
    });
    return;
  }

  await saveOrchestratorState({
    enabled: true,
    paused: false,
    currentStep: 'idle',
    statusMessage: '自动化已启动，正在检测页面...',
    startedAt: Date.now(),
    completedSteps: [],
    lastError: '',
    generatedLink: '',
  });

  beginPolling();
}

export async function stopOrchestrator(): Promise<void> {
  cancelPolling();
  await saveOrchestratorState({
    enabled: false,
    paused: true,
    currentStep: 'idle',
    statusMessage: '已停止',
  });
}

export async function resetOrchestrator(): Promise<void> {
  cancelPolling();
  // 完整清空状态，避免下次"开始"时读回 completedSteps 跳过应该跑的步骤
  const data = await browser.storage.local.get(STORAGE_KEY);
  void data;
  await browser.storage.local.set({
    [STORAGE_KEY]: {
      ...DEFAULT_STATE,
      paused: true, // 保持 paused，防止 paypal/pay.openai 自动填写仍在工作
      statusMessage: '已重置',
      updatedAt: Date.now(),
    } satisfies OrchestratorState,
  });
  notifyListeners({
    ...DEFAULT_STATE,
    paused: true,
    statusMessage: '已重置',
    updatedAt: Date.now(),
  });
}

export async function isOrchestratorPaused(): Promise<boolean> {
  return (await loadOrchestratorState()).paused;
}

export function beginPolling(): void {
  if (pollTimer) {
    return;
  }
  pollTimer = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
  void tick();
}

export async function resumeIfEnabled(): Promise<void> {
  const state = await loadOrchestratorState();
  if (state.paused) {
    return;
  }
  if (state.enabled && state.currentStep !== 'done' && state.currentStep !== 'error') {
    beginPolling();
  }
}

function cancelPolling(): void {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function tick(): Promise<void> {
  if (running) {
    return;
  }
  running = true;
  try {
    const state = await loadOrchestratorState();
    if (!state.enabled || state.paused) {
      cancelPolling();
      return;
    }

    await runStep(state);
  } catch (error) {
    console.warn(`${LOG_PREFIX} tick error`, error);
    await saveOrchestratorState({
      currentStep: 'error',
      lastError: errorMessage(error),
      statusMessage: `出错：${errorMessage(error)}`,
    });
  } finally {
    running = false;
  }
}

async function runStep(state: OrchestratorState): Promise<void> {
  const hostname = location.hostname;
  const url = location.href;

  // --- ChatGPT 登录页：填入邮箱 ---
  if (isChatGptLoginPage()) {
    if (state.completedSteps.includes('fill-email')) {
      await setStep('wait-otp', '已填过邮箱，等待跳转到验证码页...');
      return;
    }
    await setStep('fill-email', '检测到登录页，正在填入邮箱...');
    const controller = createRegisterController();
    const result = await controller.fillEmailFromInput();
    if (result.ok) {
      await markCompleted('fill-email', '邮箱已填入，等待验证码页...');
    } else {
      await setStep('error', result.message, result.message);
    }
    return;
  }

  // --- 邮箱验证码页：自动接收验证码 ---
  if (isEmailVerificationPage()) {
    if (state.completedSteps.includes('wait-otp')) {
      // 验证码已处理，先尝试获取 session（老号验证完直接登录，不需要资料页）
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      if (sessionResponse?.ok && sessionResponse.session?.accessToken) {
        await markCompleted('fill-profile', '老号已登录，跳过资料填写');
        await markCompleted('fetch-session', `Session 已读取：${sessionResponse.session.email}`);
        await generateLinkAndRedirect(sessionResponse.session.accessToken);
        return;
      }
      await setStep('fill-profile', '验证码已处理，等待资料页或登录跳转...');
      return;
    }
    await setStep('wait-otp', '检测到验证码页，正在等待 Outlook 验证码...');
    const controller = createRegisterController();
    const result = await controller.waitForOutlookOtp();
    if (result.ok) {
      await markCompleted('wait-otp', `验证码已填入：${result.code || ''}`);
    } else {
      await setStep('error', result.message, result.message);
    }
    return;
  }

  // --- 资料填写页：自动填写姓名年龄 ---
  if (isAboutYouPage()) {
    if (state.completedSteps.includes('fill-profile')) {
      await setStep('fetch-session', '资料已填，等待跳转到 chatgpt.com...');
      return;
    }
    await setStep('fill-profile', '检测到资料页，正在填写...');
    const controller = createRegisterController();
    const result = await controller.fillProfileAndCreate();
    if (result.ok) {
      await markCompleted('fill-profile', '资料已填写并提交');
    } else {
      await setStep('error', result.message, result.message);
    }
    return;
  }

  // --- chatgpt.com 主页：读取 session + 生成链接 ---
  // 只有当页面上没有登录表单时才认为已登录
  if (hostname === 'chatgpt.com' && !url.includes('/auth') && !isChatGptLoginPage()) {
    if (state.completedSteps.includes('generate-link') && state.generatedLink) {
      // 已经生成了链接，跳转过去
      await setStep('open-checkout', '正在打开支付链接...');
      window.location.href = state.generatedLink;
      return;
    }

    // 已经在 chatgpt.com 说明登录成功（不管是新号还是老号）
    // 如果之前没有标记 fill-profile（老号或者已经过了），自动标记
    if (!state.completedSteps.includes('fill-profile')) {
      await markCompleted('fill-profile', '已登录，跳过资料填写');
    }

    // 拉取 session
    await setStep('fetch-session', '正在读取 ChatGPT session...');
    const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
      type: 'opx:fetch-chatgpt-session',
    });
    if (!sessionResponse?.ok || !sessionResponse.session?.accessToken) {
      await setStep('fetch-session', sessionResponse?.message || '等待登录完成...');
      return;
    }
    if (!state.completedSteps.includes('fetch-session')) {
      await markCompleted('fetch-session', `Session 已读取：${sessionResponse.session.email}`);
    }

    // 生成链接并跳转
    await generateLinkAndRedirect(sessionResponse.session.accessToken);
    return;
  }

  // --- pay.openai.com：主动选择 PayPal + 填写地址 ---
  if (hostname === 'pay.openai.com') {
    if (!state.completedSteps.includes('open-checkout')) {
      await markCompleted('open-checkout', '已到达支付页');
    }

    if (state.completedSteps.includes('wait-payment-page')) {
      await setStep('wait-payment-page', '支付页已填写，等待跳转 PayPal...');
      return;
    }

    await setStep('wait-payment-page', '支付页已到达，正在选择 PayPal 并填写地址...');

    // 等待页面渲染
    await delay(3000);

    // 获取随机地址
    const addressResponse = await browser.runtime.sendMessage({
      type: 'opx:fetch-random-address',
      countryCode: 'US',
      city: '',
    });

    if (addressResponse?.ok && addressResponse?.address) {
      // 使用 pay-openai-autofill 中完善的填充逻辑（包括点击 PayPal + 填写所有字段）
      const fillResult = await fillPayOpenAiAddressNow(addressResponse.address);
      if (fillResult.ok) {
        await markCompleted('wait-payment-page', `支付页已填写 ${fillResult.filled} 项，等待跳转 PayPal...`);
      } else {
        // 回退到简单方式
        clickPaypalOption();
        await delay(1000);
        const address = addressResponse.address;
        fillPaymentInput('#billingName', address.fullName);
        fillPaymentSelect('#billingCountry', address.countryCode);
        await delay(600);
        fillPaymentInput('#billingAddressLine1', address.line1);
        fillPaymentInput('#billingAddressLine2', address.line2);
        fillPaymentInput('#billingLocality', address.city);
        fillPaymentInput('#billingAdministrativeArea', address.state);
        fillPaymentInput('#billingPostalCode', address.postalCode);
        fillPaymentInput('#phoneNumber', address.phone);
        checkTermsBoxes();
        await markCompleted('wait-payment-page', '支付页已填写地址（回退方式），等待跳转 PayPal...');
      }
    } else {
      await setStep('wait-payment-page', '获取地址失败，等待手动操作...');
    }
    return;
  }

  // --- paypal.com：等待 PayPal 自动填写 + 短信验证 ---
  if (hostname === 'www.paypal.com' || hostname === 'paypal.com') {
    if (!state.completedSteps.includes('wait-payment-page')) {
      await markCompleted('wait-payment-page', '已跳转 PayPal');
    }

    // PayPal 注册页面的卡号地址等由 paypal-autofill 自动处理
    // 这里我们处理短信验证码
    if (isPaypalSmsVerificationPage()) {
      await setStep('wait-paypal-sms', '检测到 PayPal 短信验证页，正在接码...');
      const smsResult = await pollPaypalSms();
      if (smsResult.ok) {
        await markCompleted('wait-paypal-sms', `短信验证码已填入：${smsResult.code}`);
        await setStep('done', '全流程完成！');
        await saveOrchestratorState({ enabled: false });
        cancelPolling();
      } else {
        await setStep('wait-paypal-sms', smsResult.message);
      }
    } else {
      await setStep('wait-paypal-sms', 'PayPal 页面填写中，等待短信验证...');
    }
    return;
  }

  // --- auth.openai.com：可能是中间跳转或验证完成页 ---
  if (hostname === 'auth.openai.com') {
    // 1. 验证码刚处理完，处理资料页或已注册账号
    if (state.completedSteps.includes('wait-otp') && !state.completedSteps.includes('fill-profile')) {
      // 先检查是否是资料页（about-you），如果是就填写
      if (isAboutYouPage()) {
        await setStep('fill-profile', '检测到资料页，正在填写...');
        const controller = createRegisterController();
        const result = await controller.fillProfileAndCreate();
        if (result.ok) {
          await markCompleted('fill-profile', '资料已填写并提交');
        } else {
          await setStep('error', result.message, result.message);
        }
        return;
      }

      // 不是资料页，尝试获取 session（已注册的号可以直接拿到）
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      if (sessionResponse?.ok && sessionResponse.session?.accessToken) {
        // 能获取到 session 说明注册已完成
        await markCompleted('fill-profile', '已注册账号，跳过资料填写');
        await markCompleted('fetch-session', `Session 已读取：${sessionResponse.session.email}`);
        // 直接生成链接并跳转，不必经过 chatgpt.com
        await generateLinkAndRedirect(sessionResponse.session.accessToken);
        return;
      }

      // 都不行，等待页面跳转（可能还在加载中）
      await setStep('fill-profile', '验证完成，等待页面跳转到资料页...');
      return;
    }

    // 2. 资料填完但还在 auth 页面，轮询 session 然后直接生成链接 + 跳转支付页（不经过 chatgpt.com）
    if (state.completedSteps.includes('fill-profile') && !state.completedSteps.includes('fetch-session')) {
      await setStep('fetch-session', '资料已提交，正在读取 session...');
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      if (sessionResponse?.ok && sessionResponse.session?.accessToken) {
        await markCompleted('fetch-session', `Session 已读取：${sessionResponse.session.email}`);
        // 直接生成订阅链接，跳过 chatgpt.com 中转
        await generateLinkAndRedirect(sessionResponse.session.accessToken);
        return;
      }
      await setStep('fetch-session', 'Session 还未生成，继续等待...');
      return;
    }

    // 3. session 已读取但链接还没生成（极少见，可能跳转失败）
    if (state.completedSteps.includes('fetch-session') && !state.completedSteps.includes('generate-link')) {
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      const token = sessionResponse?.session?.accessToken || '';
      if (token) {
        await generateLinkAndRedirect(token);
        return;
      }
      await setStep('generate-link', '等待 session...');
      return;
    }

    await setStep(state.currentStep, '在 auth.openai.com 中间页，等待跳转...');
    return;
  }
}

// 直接生成订阅链接并跳转到支付页（适用于在 auth.openai.com 上拿到 session 的情况）
async function generateLinkAndRedirect(token: string): Promise<void> {
  await setStep('generate-link', '正在生成 Plus 订阅链接...');
  const linkState = await loadLinkExtractorState();
  const linkResponse: CheckoutLinkResponse = await browser.runtime.sendMessage({
    type: 'opx:create-checkout-link',
    raw: token,
    options: linkState.checkoutOptions,
  });

  const link = linkResponse?.link || linkResponse?.url || '';
  if (!linkResponse?.ok || !link) {
    await setStep('error', linkResponse?.message || '生成链接失败', linkResponse?.message || '');
    return;
  }

  await saveOrchestratorState({ generatedLink: link });
  await markCompleted('generate-link', `链接已生成`);

  // 立即跳转到支付页（跳过 chatgpt.com 中转）
  await setStep('open-checkout', '正在跳转到支付页...');
  window.location.href = link;
}

async function setStep(step: OrchestratorStep, message: string, errorMsg?: string): Promise<void> {
  const patch: Partial<OrchestratorState> = {
    currentStep: step,
    statusMessage: message,
  };
  if (errorMsg) {
    patch.lastError = errorMsg;
  }
  await saveOrchestratorState(patch);
  console.info(`${LOG_PREFIX} [${step}] ${message}`);
}

async function markCompleted(step: OrchestratorStep, message: string): Promise<void> {
  const state = await loadOrchestratorState();
  const completed = [...state.completedSteps];
  if (!completed.includes(step)) {
    completed.push(step);
  }
  await saveOrchestratorState({
    completedSteps: completed,
    statusMessage: message,
  });
  console.info(`${LOG_PREFIX} [DONE] ${step}: ${message}`);
}

function isPaypalSmsVerificationPage(): boolean {
  // PayPal 短信验证页通常有一个验证码输入框
  const smsInput = document.querySelector<HTMLInputElement>(
    'input[name="otpCode"], input[data-testid="otpCode"], input[aria-label*="验证码"], input[aria-label*="code" i], input[placeholder*="code" i]',
  );
  if (smsInput) {
    return true;
  }

  // PayPal 分位验证码输入框（每位一个 input，name 类似 ciBasic-0, ciBasic-1, ...）
  const splitCodeInput = document.querySelector<HTMLInputElement>(
    'input[name="ciBasic-0"], input[id="ci-ciBasic-0"], input[name^="ciBasic-"]',
  );
  if (splitCodeInput) {
    return true;
  }

  // 检查页面文字
  const bodyText = (document.body?.textContent || '').toLowerCase();
  return bodyText.includes('enter the code') ||
    bodyText.includes('verification code') ||
    bodyText.includes('输入验证码') ||
    bodyText.includes('confirm your number');
}

async function pollPaypalSms(): Promise<{ ok: boolean; code: string; message: string }> {
  // 从 sms relay state 获取接码 URL
  const smsState = await loadSmsRelayState();
  const targets = parseSmsTargets(smsState.rawInput);
  if (!targets.length) {
    return { ok: false, code: '', message: '没有配置接码 API 链接，请在接码 tab 输入' };
  }

  const target = targets[0];
  const deadline = Date.now() + SMS_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const result = await fetchSmsRelayCode(target);
    if (result.kind === 'code' && result.code) {
      // 自动填入 PayPal 验证码输入框
      fillPaypalSmsCode(result.code);
      return { ok: true, code: result.code, message: `已收到验证码：${result.code}` };
    }
    await delay(SMS_POLL_INTERVAL_MS);
  }

  return { ok: false, code: '', message: '等待短信验证码超时' };
}

function fillPaypalSmsCode(code: string): void {
  // 先尝试填充分位验证码输入框（每位一个 input，name 类似 ciBasic-0, ciBasic-1, ...）
  const splitInputs = document.querySelectorAll<HTMLInputElement>(
    'input[name^="ciBasic-"]',
  );
  if (splitInputs.length > 0 && code.length >= splitInputs.length) {
    const sortedInputs = Array.from(splitInputs).sort((a, b) => {
      const indexA = parseInt(a.name.replace('ciBasic-', ''), 10) || 0;
      const indexB = parseInt(b.name.replace('ciBasic-', ''), 10) || 0;
      return indexA - indexB;
    });

    for (let i = 0; i < sortedInputs.length; i++) {
      const input = sortedInputs[i];
      const digit = code[i] || '';
      const prototype = HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor?.set) {
        descriptor.set.call(input, digit);
      } else {
        input.value = digit;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 尝试点击提交按钮
    setTimeout(() => {
      const submitButton = document.querySelector<HTMLButtonElement>(
        'button[type="submit"], button[data-testid="submit"], button.primary',
      );
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }, 500);
    return;
  }

  // 也兼容 id 为 ci-ciBasic-N 格式的分位输入
  const splitInputsById = document.querySelectorAll<HTMLInputElement>(
    'input[id^="ci-ciBasic-"]',
  );
  if (splitInputsById.length > 0 && code.length >= splitInputsById.length) {
    const sortedInputs = Array.from(splitInputsById).sort((a, b) => {
      const indexA = parseInt(a.id.replace('ci-ciBasic-', ''), 10) || 0;
      const indexB = parseInt(b.id.replace('ci-ciBasic-', ''), 10) || 0;
      return indexA - indexB;
    });

    for (let i = 0; i < sortedInputs.length; i++) {
      const input = sortedInputs[i];
      const digit = code[i] || '';
      const prototype = HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      if (descriptor?.set) {
        descriptor.set.call(input, digit);
      } else {
        input.value = digit;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 尝试点击提交按钮
    setTimeout(() => {
      const submitButton = document.querySelector<HTMLButtonElement>(
        'button[type="submit"], button[data-testid="submit"], button.primary',
      );
      if (submitButton && !submitButton.disabled) {
        submitButton.click();
      }
    }, 500);
    return;
  }

  // 回退到单输入框填充
  const smsInput = document.querySelector<HTMLInputElement>(
    'input[name="otpCode"], input[data-testid="otpCode"], input[aria-label*="验证码"], input[aria-label*="code" i], input[placeholder*="code" i]',
  );
  if (!smsInput) {
    return;
  }

  const prototype = HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor?.set) {
    descriptor.set.call(smsInput, code);
  } else {
    smsInput.value = code;
  }
  smsInput.dispatchEvent(new Event('input', { bubbles: true }));
  smsInput.dispatchEvent(new Event('change', { bubbles: true }));

  // 尝试点击提交按钮
  setTimeout(() => {
    const submitButton = document.querySelector<HTMLButtonElement>(
      'button[type="submit"], button[data-testid="submit"], button.primary',
    );
    if (submitButton && !submitButton.disabled) {
      submitButton.click();
    }
  }, 500);
}

function parseSmsTargets(rawInput: string): SmsRelayTarget[] {
  const lines = rawInput.split('\n').map((line) => line.trim()).filter(Boolean);
  const targets: SmsRelayTarget[] = [];
  for (const line of lines) {
    const parts = line.split(/[\s|]+/);
    const url = parts.find((part) => part.startsWith('http'));
    const phone = parts.find((part) => /^\+?\d{7,}$/.test(part)) || '';
    if (url) {
      targets.push({
        id: `${phone || 'auto'}-${Date.now()}`,
        phone,
        url,
      });
    }
  }
  return targets;
}

function notifyListeners(state: OrchestratorState): void {
  for (const fn of listeners) {
    try {
      fn(state);
    } catch {
      // ignore
    }
  }
}

function normalizeState(value: unknown): OrchestratorState {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_STATE };
  }
  const source = value as Record<string, unknown>;
  return {
    enabled: Boolean(source.enabled),
    paused: Boolean(source.paused),
    currentStep: isValidStep(source.currentStep) ? source.currentStep : 'idle',
    statusMessage: String(source.statusMessage || DEFAULT_STATE.statusMessage),
    startedAt: Number(source.startedAt || 0),
    completedSteps: Array.isArray(source.completedSteps)
      ? source.completedSteps.filter(isValidStep)
      : [],
    lastError: String(source.lastError || ''),
    generatedLink: String(source.generatedLink || ''),
    updatedAt: Number(source.updatedAt || 0),
  };
}

function isValidStep(value: unknown): value is OrchestratorStep {
  return typeof value === 'string' && [
    'idle', 'fill-email', 'wait-otp', 'fill-profile',
    'fetch-session', 'generate-link', 'open-checkout',
    'wait-payment-page', 'wait-paypal-sms', 'done', 'error',
  ].includes(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- PayPal 点击和地址填写辅助函数 ---

function clickPaypalOption(): void {
  // 尝试各种选择器点击 PayPal
  const selectors = [
    '[data-testid="paypal-accordion-item"]',
    '#payment-method-accordion-item-title-paypal',
    'button[data-testid="paypal-accordion-item-button"]',
    'button[aria-label*="PayPal"]',
    '[aria-label*="paypal" i]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      el.click();
      console.info('[OPX Auto] 点击了 PayPal:', selector);
      return;
    }
  }

  // 找包含 "PayPal" 文字的可点击元素
  const allClickable = document.querySelectorAll<HTMLElement>('button, label, [role="button"], [role="radio"], div[class*="accordion"], div[class*="payment"]');
  for (const el of Array.from(allClickable)) {
    const text = (el.textContent || '').toLowerCase();
    if (text.includes('paypal') && !text.includes('银行')) {
      el.click();
      console.info('[OPX Auto] 通过文本点击了 PayPal');
      return;
    }
  }

  // 尝试点击 radio button
  const radios = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  for (const radio of Array.from(radios)) {
    const parent = radio.closest('label, div, li');
    if (parent && (parent.textContent || '').toLowerCase().includes('paypal')) {
      radio.click();
      console.info('[OPX Auto] 点击了 PayPal radio');
      return;
    }
  }

  console.warn('[OPX Auto] 未找到 PayPal 选项');
}

function fillPaymentInput(selector: string, value: string): void {
  if (!value) return;
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) return;
  if (input.value === value) return;

  const proto = HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  if (desc?.set) {
    desc.set.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function fillPaymentSelect(selector: string, value: string): void {
  if (!value) return;
  const select = document.querySelector<HTMLSelectElement>(selector);
  if (!select) return;
  const option = Array.from(select.options).find(o => o.value === value || o.text.toLowerCase().includes(value.toLowerCase()));
  if (option && select.value !== option.value) {
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function checkTermsBoxes(): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  for (const cb of Array.from(checkboxes)) {
    if (!cb.checked) {
      const text = (cb.closest('label, div')?.textContent || '').toLowerCase();
      if (text.includes('terms') || text.includes('consent') || text.includes('条款') || text.includes('同意') || cb.id.includes('terms')) {
        cb.click();
      }
    }
  }
}
