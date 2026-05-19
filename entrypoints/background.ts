import { fetchRandomAddress } from '../src/features/address-autofill/address-source';
import type { RandomAddressMessage } from '../src/features/address-autofill/types';
import { createCheckoutLink } from '../src/features/link-extractor/checkout';
import { fetchChatGptSession } from '../src/features/link-extractor/session';
import type { ChatGptSessionMessage, CheckoutLinkMessage } from '../src/features/link-extractor/types';
import type { OutlookOtpMessage, OutlookOtpResponse } from '../src/features/register/types';
import type { SmsRelayFetchMessage, SmsRelayFetchResponse } from '../src/features/sms/types';

const DEFAULT_TIMEOUT_MS = 180_000;
// 轮询间隔：1.5 秒。yxiang6 接口很轻，这个频率不会被打 ban，
// 同时让"邮件已到 → 填入页面"的延迟控制在 ≤ 1.5 秒
const DEFAULT_INTERVAL_MS = 1_500;
const ASSISTANT_SCRIPT_FILE = '/content-scripts/content.js';
const ASSISTANT_URL_PREFIXES = [
  'https://chatgpt.com/',
  'https://auth.openai.com/',
  'https://pay.openai.com/',
  'https://www.paypal.com/',
  'https://paypal.com/',
];

// 唯一的邮件 API：yxiang6（无需密码/token，只需邮箱）
// 网页入口：http://www.yxiang6.com/boobar?email=xxx@outlook.com
// 真实接口：http://www.yxiang6.com/api/GetLastEmails?email=xxx&boxType=1&num=2
const YXIANG_API_BASE = 'http://www.yxiang6.com';

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

  // 从 accountLine 取邮箱（格式可能是 "email----password----clientId----refreshToken"
  // 也可能直接是裸邮箱），yxiang6 只用邮箱
  const email = (message.accountLine.split('----')[0] || message.accountLine).trim();
  if (!email) {
    return { ok: false, message: '账号行里没有邮箱' };
  }

  while (Date.now() <= deadline) {
    const result = await fetchOtpFromYxiang(email, startedAt);
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
    message: '等待 OpenAI 验证码超时',
  };
}

async function fetchOtpFromYxiang(
  email: string,
  startedAt: number,
): Promise<OutlookOtpResponse & { fatal?: boolean }> {
  // 收件箱 + 垃圾箱并行查询，谁先有验证码就用谁
  const [inboxResult, spamResult] = await Promise.all([
    queryYxiangBox(email, 1, startedAt),
    queryYxiangBox(email, 2, startedAt),
  ]);

  if (inboxResult.code) {
    return { ok: true, code: inboxResult.code, message: `yxiang6 收到验证码：${inboxResult.code}` };
  }
  if (spamResult.code) {
    return { ok: true, code: spamResult.code, message: `yxiang6(垃圾箱)收到验证码：${spamResult.code}` };
  }

  // 任一标记为 fatal 都直接返回（避免无意义轮询）
  if (inboxResult.fatal) {
    return { ok: false, fatal: true, message: inboxResult.message };
  }
  if (spamResult.fatal) {
    return { ok: false, fatal: true, message: spamResult.message };
  }

  return { ok: false, message: inboxResult.message || '暂未收到验证码' };
}

async function queryYxiangBox(
  email: string,
  boxType: 1 | 2,
  startedAt: number,
): Promise<{ code: string; message: string; fatal?: boolean }> {
  const url = `${YXIANG_API_BASE}/api/GetLastEmails?email=${encodeURIComponent(email)}&boxType=${boxType}&num=5`;

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', cache: 'no-store' });
  } catch (error) {
    return { code: '', message: `yxiang6 请求失败：${String(error)}`, fatal: false };
  }

  if (!response.ok) {
    return { code: '', message: `yxiang6 返回 ${response.status}`, fatal: false };
  }

  let data: { code?: number; message?: string; data?: unknown[] };
  try {
    data = await response.json() as { code?: number; message?: string; data?: unknown[] };
  } catch {
    return { code: '', message: 'yxiang6 返回的不是 JSON', fatal: false };
  }

  // code !== 200 时返回的 message 一般是「未找到该邮箱的授权信息」之类，属于致命错误
  // 因为继续轮询也是同样结果
  if (data.code !== 200) {
    const msg = data.message || '邮箱不可用';
    // 「未找到授权」标记为 fatal，这种情况靠等是没用的
    const fatal = /未找到|授权/.test(msg);
    return { code: '', message: `yxiang6: ${msg}`, fatal };
  }

  if (!Array.isArray(data.data)) {
    return { code: '', message: 'yxiang6 返回 data 不是数组', fatal: false };
  }

  // 遍历每封邮件，取最新一封 OpenAI 验证码邮件，且时间戳 ≥ startedAt - 60s
  const startedAtSeconds = startedAt / 1000;
  for (const mail of data.data) {
    const result = extractOtpFromYxiangMail(mail, startedAtSeconds);
    if (result) {
      return { code: result, message: '' };
    }
  }

  return { code: '', message: '暂未收到 OpenAI 验证码邮件', fatal: false };
}

function extractOtpFromYxiangMail(mail: unknown, startedAtSeconds: number): string {
  if (!mail || typeof mail !== 'object') {
    return '';
  }
  const m = mail as Record<string, unknown>;

  // 邮件时间过滤：如果邮件比开始时间早，跳过（避免拿到上一次的旧验证码）
  const dateStr = String(m.date || m.Date || m.received_at || m.receivedAt || m.time || '');
  if (dateStr) {
    const t = Date.parse(dateStr);
    if (!Number.isNaN(t)) {
      const tSec = t / 1000;
      // 留 60 秒余地，避免本地时钟和服务器时钟漂移
      if (tSec < startedAtSeconds - 60) {
        return '';
      }
    }
  }

  const subject = String(m.subject || m.Subject || '');
  const text = String(m.text || m.Text || '');
  const body = String(
    m.body || m.Body || m.content || m.Content || m.html || m.Html || ''
  );
  const from = String(m.from || m.From || m.sender || m.Sender || '');

  // 确认是 OpenAI/ChatGPT 验证码邮件
  const fullText = `${from} ${subject} ${text} ${body}`;
  const lower = fullText.toLowerCase();
  if (
    !lower.includes('openai') &&
    !lower.includes('chatgpt') &&
    !lower.includes('验证码') &&
    !lower.includes('verification') &&
    !lower.includes('verify')
  ) {
    return '';
  }

  // 提取 6 位验证码
  const searchText = `${text}\n${body}`;
  const patterns = [
    /验证码以继续[：:]\s*\n*\s*(\d{6})/,
    /临时验证码[：:]\s*\n*\s*(\d{6})/,
    /verification code[：:]?\s*\n*\s*(\d{6})/i,
    /code to continue[：:]?\s*\n*\s*(\d{6})/i,
    /\n\s*(\d{6})\s*\n/,
    />\s*(\d{6})\s*</,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(searchText);
    if (match?.[1]) {
      return match[1];
    }
  }

  // 回退：找独立行的 6 位数
  const lines = searchText
    .split(/[\n\r]+/)
    .map((line) => line.replace(/<[^>]*>/g, '').trim());
  for (const line of lines) {
    if (/^\d{6}$/.test(line)) {
      return line;
    }
  }

  return '';
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
