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

  // 先清空收件箱，确保下次拿到的是最新验证码
  await clearInboxBeforePolling(message.accountLine);

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

// 清空收件箱，确保下次拿到的邮件是新的验证码
async function clearInboxBeforePolling(accountLine: string): Promise<void> {
  const parts = accountLine.split('----').map((s) => s.trim());
  const email = parts[0] || '';
  const clientId = parts[2] || '';
  const refreshToken = parts[3] || '';
  const hasFullToken = refreshToken.length > 50;

  // 小苹果 API 清空收件箱
  if (hasFullToken && clientId) {
    try {
      const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        email: email,
      });
      await fetch(`${MAIL_API_BASE}/api/process-inbox?${params.toString()}`, { method: 'GET', cache: 'no-store' });
      console.info('[OPX] 已清空收件箱（小苹果）');
    } catch (e) {
      console.warn('[OPX] 清空收件箱失败:', e);
    }
  }

  // 等一小会让清空生效
  await delay(1000);
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

// 精准提取 OpenAI 验证码
// API 返回格式: { code: 200, success: true, data: { send, subject, text, html, date }, new_refresh_token }
// 验证码在 data.text 里: "输入此临时验证码以继续：\n\n273783\n\n"
function extractOpenAiOtp(data: Record<string, unknown>): string {
  // 小苹果 API 返回结构: data.data.text 或 data.data.html
  const mailData = (data as any)?.data;
  const text = String(mailData?.text || '');
  const subject = String(mailData?.subject || '');
  const send = String(mailData?.send || '');

  // 优先从纯文本 text 里提取（最可靠）
  // OpenAI 邮件格式: "输入此临时验证码以继续：\n\n273783\n\n"
  const textPatterns = [
    /验证码以继续[：:]\s*\n*\s*(\d{6})/,
    /临时验证码[：:]\s*\n*\s*(\d{6})/,
    /verification code[：:]\s*\n*\s*(\d{6})/i,
    /code to continue[：:]\s*\n*\s*(\d{6})/i,
    /\n(\d{6})\n/,  // 单独一行的 6 位数字
  ];

  for (const pattern of textPatterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      console.info('[OPX OTP] 从 text 提取到验证码:', match[1]);
      return match[1];
    }
  }

  // 从 HTML 里提取（验证码通常在一个独立的 <p> 标签里，字体大）
  const html = String(mailData?.html || '');
  const htmlPatterns = [
    /font-size:\s*24px[^>]*>\s*(?:<!--.*?-->)?\s*(\d{6})\s*(?:<!--.*?-->)?\s*<\/p>/s,
    /padding:\s*28px[^>]*>\s*(?:<!--.*?-->)?\s*(\d{6})\s*(?:<!--.*?-->)?\s*<\/p>/s,
    /border-radius:\s*16px[^>]*>\s*(?:<!--.*?-->)?\s*(\d{6})\s*(?:<!--.*?-->)?\s*<\/p>/s,
  ];

  for (const pattern of htmlPatterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      console.info('[OPX OTP] 从 html 提取到验证码:', match[1]);
      return match[1];
    }
  }

  // 最后回退: 从 text 里找被换行符包围的独立 6 位数
  const lines = text.split('\n').map((l: string) => l.trim());
  for (const line of lines) {
    if (/^\d{6}$/.test(line)) {
      console.info('[OPX OTP] 从 text 行提取到验证码:', line);
      return line;
    }
  }

  console.warn('[OPX OTP] 未能提取验证码, subject:', subject, 'send:', send);
  return '';
}

// --- yxiang6 邮件 API（只需 email，不需要密码/token）---
const YXIANG_API_BASE = 'http://yxiang6.com';

async function fetchOtpViaGraph(
  accountLine: string,
  startedAt: number,
): Promise<(OutlookOtpResponse & { fatal?: boolean }) | null> {
  const parts = accountLine.split('----').map((s) => s.trim());
  const email = parts[0] || '';
  if (!email) {
    return null;
  }

  const refreshToken = parts[3] || '';
  const clientId = parts[2] || '';
  const hasFullToken = refreshToken.length > 50;

  // 策略1: 如果有完整 refresh_token，先用小苹果 API
  if (hasFullToken && clientId) {
    const appleResult = await fetchOtpFromAppleApi(email, clientId, refreshToken);
    if (appleResult?.ok) {
      return appleResult;
    }
    console.info('[OPX] 小苹果 API 未获取到，尝试 yxiang6...');
  }

  // 策略2: 用 yxiang6 API（只需 email）
  const yxiangResult = await fetchOtpFromYxiang(email);
  if (yxiangResult?.ok) {
    return yxiangResult;
  }

  // 策略3: 如果有 token 但小苹果失败了，返回小苹果的错误
  if (hasFullToken && clientId) {
    const appleResult = await fetchOtpFromAppleApi(email, clientId, refreshToken);
    if (appleResult) {
      return appleResult;
    }
  }

  return yxiangResult || {
    ok: false,
    message: '暂未收到 OpenAI 验证码邮件',
  };
}

async function fetchOtpFromAppleApi(
  email: string,
  clientId: string,
  refreshToken: string,
): Promise<(OutlookOtpResponse & { fatal?: boolean }) | null> {
  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      email: email,
      mailbox: 'INBOX',
      response_type: 'json',
    });

    const apiUrl = `${MAIL_API_BASE}/api/mail-new?${params.toString()}`;
    console.info('[OPX 小苹果] 请求 INBOX');

    const response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, fatal: false, message: `小苹果 API 返回 ${response.status}` };
    }

    const data = await response.json() as Record<string, unknown>;
    const code = extractOpenAiOtp(data);
    if (code) {
      return { ok: true, code, message: `小苹果收到验证码：${code}` };
    }

    // 查垃圾箱
    const junkParams = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      email: email,
      mailbox: 'Junk',
      response_type: 'json',
    });
    const junkResponse = await fetch(`${MAIL_API_BASE}/api/mail-new?${junkParams.toString()}`, { method: 'GET', cache: 'no-store' });
    if (junkResponse.ok) {
      const junkData = await junkResponse.json() as Record<string, unknown>;
      const junkCode = extractOpenAiOtp(junkData);
      if (junkCode) {
        return { ok: true, code: junkCode, message: `小苹果(垃圾箱)收到验证码：${junkCode}` };
      }
    }

    return { ok: false, message: '小苹果暂未收到验证码' };
  } catch (error) {
    return { ok: false, fatal: false, message: `小苹果 API 错误：${String(error)}` };
  }
}

async function fetchOtpFromYxiang(email: string): Promise<(OutlookOtpResponse & { fatal?: boolean }) | null> {
  try {
    // yxiang6 API: /api/GetLastEmails?email=xxx&boxType=1&num=2 (收件箱)
    const inboxUrl = `${YXIANG_API_BASE}/api/GetLastEmails?email=${encodeURIComponent(email)}&boxType=1&num=2`;
    console.info('[OPX yxiang6] 请求收件箱:', email);

    const response = await fetch(inboxUrl, { method: 'GET', cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, fatal: false, message: `yxiang6 API 返回 ${response.status}` };
    }

    const data = await response.json() as { code?: number; data?: any[]; message?: string };
    console.info('[OPX yxiang6] 响应 code:', data.code, 'data length:', data.data?.length);

    if (data.code === 200 && Array.isArray(data.data)) {
      for (const mail of data.data) {
        const code = extractOtpFromYxiangMail(mail);
        if (code) {
          return { ok: true, code, message: `yxiang6 收到验证码：${code}` };
        }
      }
    }

    // 查垃圾箱 boxType=2
    const spamUrl = `${YXIANG_API_BASE}/api/GetLastEmails?email=${encodeURIComponent(email)}&boxType=2&num=2`;
    const spamResponse = await fetch(spamUrl, { method: 'GET', cache: 'no-store' });
    if (spamResponse.ok) {
      const spamData = await spamResponse.json() as { code?: number; data?: any[] };
      if (spamData.code === 200 && Array.isArray(spamData.data)) {
        for (const mail of spamData.data) {
          const code = extractOtpFromYxiangMail(mail);
          if (code) {
            return { ok: true, code, message: `yxiang6(垃圾箱)收到验证码：${code}` };
          }
        }
      }
    }

    return { ok: false, message: data.message || '暂未收到验证码' };
  } catch (error) {
    return { ok: false, fatal: false, message: `yxiang6 API 错误：${String(error)}` };
  }
}

function extractOtpFromYxiangMail(mail: any): string {
  const subject = String(mail?.subject || mail?.Subject || '');
  const body = String(mail?.body || mail?.Body || mail?.content || mail?.Content || mail?.html || mail?.Html || '');
  const text = String(mail?.text || mail?.Text || '');
  const from = String(mail?.from || mail?.From || mail?.sender || '');

  // 确认是 OpenAI 邮件
  const fullText = `${from} ${subject} ${body} ${text}`;
  const lower = fullText.toLowerCase();
  if (!lower.includes('openai') && !lower.includes('chatgpt') && !lower.includes('验证码') && !lower.includes('verification')) {
    return '';
  }

  // 从 text/body 里提取验证码
  const searchText = `${text}\n${body}`;
  const patterns = [
    /验证码以继续[：:]\s*\n*\s*(\d{6})/,
    /临时验证码[：:]\s*\n*\s*(\d{6})/,
    /verification code[：:]\s*\n*\s*(\d{6})/i,
    /\n(\d{6})\n/,
    />\s*(\d{6})\s*</,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(searchText);
    if (match?.[1]) {
      return match[1];
    }
  }

  // 回退: 找独立行的 6 位数
  const lines = searchText.split(/[\n\r]+/).map((l: string) => l.replace(/<[^>]*>/g, '').trim());
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
