import { fillEmailAndContinue, isChatGptLoginPage } from './chatgpt-auth-page';
import { fillOtpAndContinue, isEmailVerificationPage } from './openai-email-verification-page';
import { fillAboutYouAndCreate, isAboutYouPage } from './openai-about-you-page';
import { parseAccountInput } from './account-input';
import { loadRegisterState, saveRegisterState } from '../../app/state';
import type { ActionResult, PageState, RegisterController } from './types';

let autoProfileStarted = false;

export function createRegisterController(): RegisterController {
  return {
    getPageState,
    loadState: loadRegisterState,
    saveInput: async (rawInput: string) => {
      const parsed = parseAccountInput(rawInput);
      return saveRegisterState({
        rawInput,
        email: parsed.email,
        accountLine: parsed.accountLine,
        inputMode: parsed.mode,
        autoOtp: parsed.mode === 'outlook-line',
      });
    },
    saveApiBase: async (apiBase: string) => {
      return saveRegisterState({ apiBase: apiBase.trim() });
    },
    fillEmailFromInput: async () => {
      const state = await loadRegisterState();
      const parsed = parseAccountInput(state.rawInput);
      if (!parsed.ok) {
        return fail(parsed.message);
      }
      if (!isChatGptLoginPage()) {
        return fail('当前页面不是 ChatGPT 登录页');
      }
      await saveRegisterState({
        email: parsed.email,
        accountLine: parsed.accountLine,
        inputMode: parsed.mode,
        autoOtp: parsed.mode === 'outlook-line',
        otpRequestedAt: Date.now(),
      });
      return fillEmailAndContinue(parsed.email);
    },
    fillOtp: async (code: string) => {
      if (!isEmailVerificationPage()) {
        return fail('当前页面不是邮箱验证码页');
      }
      return fillOtpAndContinue(code);
    },
    waitForOutlookOtp: async () => {
      if (!isEmailVerificationPage()) {
        return fail('当前页面不是邮箱验证码页');
      }
      const state = await loadRegisterState();
      if (!state.accountLine) {
        return fail('当前输入不是 Outlook 账号行，不能自动接收验证码');
      }

      const deadline = Date.now() + 180_000;
      const intervalMs = 5_000;

      // 轮询在 content script 里做（避免 MV3 service worker 30 秒超时）
      while (Date.now() <= deadline) {
        const response = await browser.runtime.sendMessage({
          type: 'opx:wait-outlook-otp',
          accountLine: state.accountLine,
          apiBase: state.apiBase,
          since: state.otpRequestedAt || state.updatedAt || Date.now(),
        });

        if (!isActionResult(response)) {
          console.error('[OPX] waitForOutlookOtp 返回无效:', JSON.stringify(response));
          return fail(`Outlook API 没有返回有效结果（${typeof response === 'object' ? JSON.stringify(response).slice(0, 100) : String(response)}）`);
        }

        if (response.ok && response.code) {
          const fillResult = await fillOtpAndContinue(response.code);
          return {
            ...fillResult,
            code: response.code,
            message: fillResult.ok ? `已收到并提交验证码：${response.code}` : fillResult.message,
          };
        }

        // 如果是 fatal 错误直接返回
        if (!response.ok && (response as any).fatal) {
          return response;
        }

        // 等待后重试
        await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
      }

      return fail('等待 Outlook 验证码超时');
    },
    fillProfileAndCreate: async () => {
      if (!isAboutYouPage()) {
        return fail('当前页面不是资料填写页');
      }
      return fillAboutYouAndCreate();
    },
    autoRunForCurrentPage: async () => {
      if (!isAboutYouPage() || autoProfileStarted) {
        return;
      }
      autoProfileStarted = true;
      await waitForPageReady();
      await fillAboutYouAndCreate();
    },
  };
}

function getPageState(): PageState {
  if (isChatGptLoginPage()) {
    return {
      kind: 'login',
      label: 'ChatGPT 登录页',
      canFillEmail: true,
      canFillOtp: false,
      canFillProfile: false,
    };
  }

  if (isEmailVerificationPage()) {
    return {
      kind: 'email-verification',
      label: '邮箱验证码页',
      canFillEmail: false,
      canFillOtp: true,
      canFillProfile: false,
    };
  }

  if (isAboutYouPage()) {
    return {
      kind: 'about-you',
      label: '资料填写页',
      canFillEmail: false,
      canFillOtp: false,
      canFillProfile: true,
    };
  }

  return {
    kind: 'unknown',
    label: '未识别页面',
    canFillEmail: false,
    canFillOtp: false,
    canFillProfile: false,
  };
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

function isActionResult(value: unknown): value is ActionResult {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as ActionResult).ok === 'boolean' &&
      typeof (value as ActionResult).message === 'string',
  );
}

function waitForPageReady(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 800));
}
