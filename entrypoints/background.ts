import { fetchRandomAddress } from '../src/features/address-autofill/address-source';
import type { RandomAddressMessage } from '../src/features/address-autofill/types';
import { createCheckoutLink } from '../src/features/link-extractor/checkout';
import { fetchChatGptSession } from '../src/features/link-extractor/session';
import type { ChatGptSessionMessage, CheckoutLinkMessage } from '../src/features/link-extractor/types';
import type { OutlookOtpMessage, OutlookOtpResponse } from '../src/features/register/types';
import type { SmsRelayFetchMessage, SmsRelayFetchResponse } from '../src/features/sms/types';

const DEFAULT_OUTLOOK_API_BASE = 'http://127.0.0.1:8787';
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_INTERVAL_MS = 5_000;
const ASSISTANT_SCRIPT_FILE = '/content-scripts/content.js';
const ASSISTANT_URL_PREFIXES = [
  'https://chatgpt.com/',
  'https://auth.openai.com/',
  'https://pay.openai.com/',
  'https://www.paypal.com/',
  'https://paypal.com/',
];

export default defineBackground(() => {
  installAssistantInjector();

  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isOutlookOtpMessage(message)) {
      if (isCheckoutLinkMessage(message)) {
        return createCheckoutLink(message.raw, message.options);
      }
      if (isChatGptSessionMessage(message)) {
        return fetchChatGptSession();
      }
      if (isRandomAddressMessage(message)) {
        return fetchRandomAddress(message.countryCode, message.city);
      }
      if (isSmsRelayFetchMessage(message)) {
        return fetchSmsRelay(message.url);
      }
      return undefined;
    }

    return waitForOutlookOtp(message);
  });
});

function installAssistantInjector(): void {
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !isAssistantUrl(tab.url)) {
      return;
    }
    setTimeout(() => void injectAssistant(tabId), 300);
  });

  void browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (typeof tab.id === 'number' && isAssistantUrl(tab.url)) {
        void injectAssistant(tab.id);
      }
    }
  }).catch((error) => {
    console.debug('[OPX] initial assistant injection skipped', error);
  });
}

async function injectAssistant(tabId: number): Promise<void> {
  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: [ASSISTANT_SCRIPT_FILE],
    });
  } catch (error) {
    console.debug('[OPX] assistant injection skipped', { tabId, error });
  }
}

function isAssistantUrl(url: string | undefined): boolean {
  return ASSISTANT_URL_PREFIXES.some((prefix) => url?.startsWith(prefix));
}

async function waitForOutlookOtp(message: OutlookOtpMessage): Promise<OutlookOtpResponse> {
  const startedAt = message.since ?? Date.now();
  const deadline = Date.now() + (message.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const intervalMs = message.intervalMs ?? DEFAULT_INTERVAL_MS;
  const apiBase = normalizeApiBase(message.apiBase || DEFAULT_OUTLOOK_API_BASE);

  while (Date.now() <= deadline) {
    const result = await fetchLatestOtp(apiBase, message.accountLine, startedAt);
    if (result.ok && result.code) {
      return result;
    }
    if (!result.ok && result.fatal) {
      return result;
    }
    await delay(intervalMs);
  }

  return {
    ok: false,
    message: '等待 Outlook 验证码超时',
  };
}

async function fetchLatestOtp(
  apiBase: string,
  accountLine: string,
  startedAt: number,
): Promise<OutlookOtpResponse & { fatal?: boolean }> {
  // 先尝试直接通过 Microsoft Graph API 读取（不需要本地服务）
  const graphResult = await fetchOtpViaGraph(accountLine, startedAt);
  if (graphResult) {
    return graphResult;
  }

  // 如果 Graph API 不可用（没有 client_id/refresh_token），回退到本地 API
  let response: Response;
  try {
    response = await fetch(`${apiBase}/api/outlook/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_line: accountLine,
        limit: 10,
        mailbox: 'default',
        query: 'OpenAI',
        unseen_only: false,
        mark_seen: false,
      }),
    });
  } catch (error) {
    return {
      ok: false,
      fatal: true,
      message: `无法连接 Outlook 本地 API：${String(error)}`,
    };
  }

  if (!response.ok) {
    const detail = await readResponseDetail(response);
    return {
      ok: false,
      fatal: true,
      message: `Outlook API 返回 ${response.status}：${detail}`,
    };
  }

  const payload = await response.json() as OutlookFetchPayload;
  const startedAtSeconds = startedAt / 1000;
  const messages = [...(payload.messages || [])].sort(
    (a, b) => Number(b.received_at || 0) - Number(a.received_at || 0),
  );

  const fresh = messages.find((item) => {
    if (!item.otp) {
      return false;
    }
    const receivedAt = Number(item.received_at || 0);
    return !receivedAt || receivedAt >= startedAtSeconds - 15;
  });

  if (!fresh?.otp) {
    return {
      ok: false,
      message: '暂未收到新的 Outlook 验证码',
    };
  }

  return {
    ok: true,
    code: fresh.otp,
    message: `收到验证码：${fresh.otp}`,
  };
}

// --- 小苹果邮件服务 API 读取邮件 OTP ---
const MAIL_API_BASE = 'https://apple.882263.xyz';
const OTP_RE = /\b(\d{6})\b/;

// 精准提取 OpenAI 验证码：
// 1. 先确认是 OpenAI 的邮件（from/subject 包含 openai）
// 2. 用多种模式匹配验证码，排除日期等干扰数字
function extractOpenAiOtp(data: Record<string, unknown>): string {
  const fullJson = JSON.stringify(data);

  // 检查是否是 OpenAI 相关邮件
  const lowerJson = fullJson.toLowerCase();
  const isOpenAi = lowerJson.includes('openai') ||
    lowerJson.includes('verify your email') ||
    lowerJson.includes('verification code') ||
    lowerJson.includes('验证码') ||
    lowerJson.includes('noreply@tm.openai.com');

  if (!isOpenAi) {
    return '';
  }

  // 尝试从邮件 body/content 里提取
  const body = String(
    (data as any)?.body?.content ||
    (data as any)?.body ||
    (data as any)?.content ||
    (data as any)?.html ||
    (data as any)?.text ||
    ''
  );
  const subject = String((data as any)?.subject || '');
  const searchText = `${subject} ${body} ${fullJson}`;

  // 模式1: "验证码是 123456" 或 "code is 123456" 或 "code: 123456"
  const codePatterns = [
    /(?:验证码|code|码)\s*(?:是|is|：|:)\s*(\d{6})/i,
    /(?:enter|输入|use)\s+(?:the\s+)?(?:code\s+)?(\d{6})/i,
    /(\d{6})\s*(?:是你的|is your|as your)/i,
    />\s*(\d{6})\s*</,  // HTML tag 中间的独立 6 位数
    /[\s"'](\d{6})[\s"']/,  // 被空格或引号包围的 6 位数
  ];

  for (const pattern of codePatterns) {
    const match = pattern.exec(searchText);
    if (match?.[1]) {
      return match[1];
    }
  }

  // 模式2: 直接找所有 6 位数字，排除明显不是验证码的（年份、日期等）
  const allMatches = searchText.match(/\b(\d{6})\b/g) || [];
  for (const candidate of allMatches) {
    // 排除年份开头（如 202xxx）、00开头等
    if (candidate.startsWith('20') && parseInt(candidate.slice(2, 4)) <= 26) {
      continue; // 可能是日期 202305 之类
    }
    if (candidate === '000000') {
      continue;
    }
    return candidate;
  }

  return '';
}

async function fetchOtpViaGraph(
  accountLine: string,
  startedAt: number,
): Promise<(OutlookOtpResponse & { fatal?: boolean }) | null> {
  const parts = accountLine.split('----').map((s) => s.trim());
  if (parts.length < 4 || !parts[2] || !parts[3]) {
    return null;
  }

  const [email, password, clientId, refreshToken] = parts;

  // 调用小苹果 API 获取最新邮件
  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      email: email,
      mailbox: 'INBOX',
      response_type: 'json',
    });

    const apiUrl = `${MAIL_API_BASE}/api/mail-new?${params.toString()}`;
    console.info('[OPX Mail API] 请求:', apiUrl.replace(refreshToken, '***'));

    const response = await fetch(apiUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[OPX Mail API] 请求失败:', response.status, errText);
      return {
        ok: false,
        fatal: false,
        message: `邮件 API 返回 ${response.status}：${errText.slice(0, 200)}`,
      };
    }

    const data = await response.json() as Record<string, unknown>;
    console.info('[OPX Mail API] 响应:', JSON.stringify(data).slice(0, 500));

    // 从返回数据中提取 OpenAI 验证码
    const code = extractOpenAiOtp(data);
    if (code) {
      return {
        ok: true,
        code,
        message: `邮件 API 收到验证码：${code}`,
      };
    }

    // 也尝试查垃圾箱
    const junkParams = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      email: email,
      mailbox: 'Junk',
      response_type: 'json',
    });

    const junkUrl = `${MAIL_API_BASE}/api/mail-new?${junkParams.toString()}`;
    const junkResponse = await fetch(junkUrl, { method: 'GET', cache: 'no-store' });
    if (junkResponse.ok) {
      const junkData = await junkResponse.json() as Record<string, unknown>;
      const junkCode = extractOpenAiOtp(junkData);
      if (junkCode) {
        return {
          ok: true,
          code: junkCode,
          message: `邮件 API (垃圾箱) 收到验证码：${junkCode}`,
        };
      }
    }

    return {
      ok: false,
      message: '暂未收到 OpenAI 验证码邮件',
    };
  } catch (error) {
    console.warn('[OPX Mail API] 错误:', error);
    return {
      ok: false,
      fatal: false,
      message: `邮件 API 连接失败：${String(error)}`,
    };
  }
}

function isOutlookOtpMessage(message: unknown): message is OutlookOtpMessage {
  return Boolean(
    message &&
      typeof message === 'object' &&
      (message as OutlookOtpMessage).type === 'opx:wait-outlook-otp' &&
      typeof (message as OutlookOtpMessage).accountLine === 'string',
  );
}

function isCheckoutLinkMessage(message: unknown): message is CheckoutLinkMessage {
  return Boolean(
    message &&
      typeof message === 'object' &&
      (message as CheckoutLinkMessage).type === 'opx:create-checkout-link' &&
      typeof (message as CheckoutLinkMessage).raw === 'string' &&
      typeof (message as CheckoutLinkMessage).options === 'object',
  );
}

function isChatGptSessionMessage(message: unknown): message is ChatGptSessionMessage {
  return Boolean(
    message &&
      typeof message === 'object' &&
      (message as ChatGptSessionMessage).type === 'opx:fetch-chatgpt-session',
  );
}

function isRandomAddressMessage(message: unknown): message is RandomAddressMessage {
  return Boolean(
    message &&
      typeof message === 'object' &&
      (
        (message as RandomAddressMessage).type === 'opx:fetch-random-address' ||
        (message as RandomAddressMessage).type === 'opx:fetch-random-us-address'
      ),
  );
}

function isSmsRelayFetchMessage(message: unknown): message is SmsRelayFetchMessage {
  return Boolean(
    message &&
      typeof message === 'object' &&
      (message as SmsRelayFetchMessage).type === 'opx:fetch-sms-relay' &&
      typeof (message as SmsRelayFetchMessage).url === 'string',
  );
}

async function fetchSmsRelay(url: string): Promise<SmsRelayFetchResponse> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        ok: false,
        message: '接码 API 只支持 http/https 链接',
      };
    }
  } catch {
    return {
      ok: false,
      message: '接码 API 链接格式无效',
    };
  }

  let response: Response;
  try {
    response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
    });
  } catch (error) {
    return {
      ok: false,
      message: `接码 API 请求失败：${String(error)}`,
    };
  }

  const status = response.status;
  const { parsed: detail, text } = await readSmsRelayResponse(response);
  if (!response.ok) {
    return {
      ok: false,
      status,
      message: `接码 API 返回 ${status}：${text || response.statusText}`,
      text,
      raw: detail,
    };
  }

  if (isRecord(detail)) {
    const data = String(detail.data || '').trim();
    const message = String(detail.msg || detail.message || 'OK');
    return {
      ok: isSmsRelaySuccessPayload(detail),
      status,
      message,
      data,
      text,
      raw: detail,
    };
  }

  return {
    ok: true,
    status,
    message: 'OK',
    data: String(detail || '').trim(),
    text,
    raw: detail,
  };
}

async function readSmsRelayResponse(response: Response): Promise<{ parsed: unknown; text: string }> {
  const text = await response.text();
  if (!text) {
    return { parsed: '', text: '' };
  }
  try {
    return { parsed: JSON.parse(text), text };
  } catch {
    return { parsed: text, text };
  }
}

function normalizeApiBase(value: string): string {
  return value.replace(/\/+$/, '');
}

async function readResponseDetail(response: Response): Promise<string> {
  try {
    const data = await response.json() as { detail?: string };
    return data.detail || response.statusText;
  } catch {
    return response.statusText;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function isSmsRelaySuccessPayload(value: Record<string, unknown>): boolean {
  if (typeof value.success === 'boolean') {
    return value.success;
  }
  if (typeof value.ok === 'boolean') {
    return value.ok;
  }

  const codeValue = value.code ?? value.status ?? value.statusCode;
  if (codeValue === undefined || codeValue === null || codeValue === '') {
    return true;
  }

  const code = Number(codeValue);
  if (Number.isNaN(code)) {
    return true;
  }
  return code === 0 || code === 1 || code === 200;
}

interface OutlookFetchPayload {
  messages?: Array<{
    otp?: string;
    received_at?: number;
  }>;
}
