import { loadRegisterState, saveRegisterState, loadLinkExtractorState, loadSmsRelayState } from '../../app/state';
import { createRegisterController } from '../register/controller';
import { isChatGptLoginPage } from '../register/chatgpt-auth-page';
import { isEmailVerificationPage } from '../register/openai-email-verification-page';
import { isAboutYouPage } from '../register/openai-about-you-page';
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
      currentStep: 'error',
      lastError: '请先在注册 tab 输入 Outlook 账号行',
      statusMessage: '请先输入账号',
    });
    return;
  }

  await saveOrchestratorState({
    enabled: true,
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
    currentStep: 'idle',
    statusMessage: '已停止',
  });
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
    if (!state.enabled) {
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
      await setStep('fill-profile', '验证码已处理，等待资料页...');
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

    if (!state.completedSteps.includes('fetch-session')) {
      await setStep('fetch-session', '正在读取 ChatGPT session...');
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      if (!sessionResponse?.ok || !sessionResponse.session?.accessToken) {
        // 可能还没登录完成，等一会再试
        await setStep('fetch-session', sessionResponse?.message || '等待登录完成...');
        return;
      }
      await markCompleted('fetch-session', `Session 已读取：${sessionResponse.session.email}`);
    }

    // 生成订阅链接
    if (!state.completedSteps.includes('generate-link')) {
      await setStep('generate-link', '正在生成 Plus 订阅链接...');
      const sessionResponse: ChatGptSessionResponse = await browser.runtime.sendMessage({
        type: 'opx:fetch-chatgpt-session',
      });
      const token = sessionResponse?.session?.accessToken || '';
      if (!token) {
        await setStep('error', '无法获取 accessToken', '无法获取 accessToken');
        return;
      }

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

      // 立即跳转
      await setStep('open-checkout', '正在跳转到支付页...');
      window.location.href = link;
      return;
    }
    return;
  }

  // --- pay.openai.com：主动选择 PayPal + 填写地址 ---
  if (hostname === 'pay.openai.com') {
    if (!state.completedSteps.includes('open-checkout')) {
      await markCompleted('open-checkout', '已到达支付页');
    }
    await setStep('wait-payment-page', '支付页已到达，正在选择 PayPal 并填写地址...');

    // 主动触发：选择 PayPal + 填写地址
    const { initPayOpenAiAddressAutofill, fillPayOpenAiAddressNow } = await import('../address-autofill/pay-openai-autofill');
    try {
      initPayOpenAiAddressAutofill();
    } catch { /* already initialized */ }

    // 等待页面渲染
    await delay(1500);

    // 尝试点击 PayPal 并填写地址
    const addressResponse = await browser.runtime.sendMessage({
      type: 'opx:fetch-random-address',
      countryCode: 'US',
      city: '',
    });
    if (addressResponse?.ok && addressResponse?.address) {
      const result = await fillPayOpenAiAddressNow(addressResponse.address);
      if (result.ok) {
        await setStep('wait-payment-page', `支付页已填写 ${result.filled} 项，等待跳转 PayPal...`);
      }
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

  // --- auth.openai.com：可能是中间跳转 ---
  if (hostname === 'auth.openai.com') {
    await setStep(state.currentStep, '在 auth.openai.com 中间页，等待跳转...');
    return;
  }
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
