import type { FeaturePanelHandle } from '../../app/types';
import type { RegisterController } from './types';

export function createRegisterPanel(container: HTMLElement, controller: RegisterController): FeaturePanelHandle {
  const accountInput = document.createElement('textarea');
  accountInput.className = 'opx-textarea';
  accountInput.placeholder = '邮箱或 Outlook 行';
  accountInput.autocomplete = 'off';
  accountInput.spellcheck = false;

  const inputHint = document.createElement('div');
  inputHint.className = 'opx-hint';
  inputHint.textContent = '支持 user@example.com 或 email----password----client_id----refresh_token';

  const emailButton = createButton('填入邮箱并继续');
  const otp = document.createElement('input');
  otp.className = 'opx-input';
  otp.type = 'text';
  otp.inputMode = 'numeric';
  otp.placeholder = '验证码';
  otp.autocomplete = 'one-time-code';

  const otpButton = createButton('填入验证码并继续');
  const autoOtpButton = createButton('自动接收并填入验证码', 'opx-button opx-button-secondary');
  const profileButton = createButton('填写资料并创建');

  // --- 收码 API 地址 ---
  const apiSection = document.createElement('div');
  apiSection.style.cssText = 'margin-top:10px;padding:8px;border:1px solid rgba(47,209,124,0.3);border-radius:6px;background:rgba(15,23,42,0.6);';
  const apiLabel = document.createElement('div');
  apiLabel.style.cssText = 'font-size:11px;color:#10b981;font-weight:600;margin-bottom:4px;';
  apiLabel.textContent = '收码 API 地址（别人使用需修改）';
  const apiInput = document.createElement('input');
  apiInput.className = 'opx-input';
  apiInput.type = 'url';
  apiInput.placeholder = 'http://127.0.0.1:8787';
  apiInput.style.cssText = 'width:100%;padding:6px 8px;font-size:12px;box-sizing:border-box;';
  apiInput.autocomplete = 'off';
  const apiHint = document.createElement('div');
  apiHint.className = 'opx-hint';
  apiHint.style.cssText = 'font-size:11px;color:#f59e0b;margin-top:4px;';
  apiHint.textContent = '⚠️ 默认为本机地址，其他人使用需要改为公网收码服务地址';
  apiSection.append(apiLabel, apiInput, apiHint);

  const status = document.createElement('div');
  status.className = 'opx-status';
  status.textContent = '等待操作';

  const update = async () => {
    const page = controller.getPageState();
    const saved = await controller.loadState();
    if (accountInput.value !== saved.rawInput) {
      accountInput.value = saved.rawInput;
    }
    if (apiInput.value !== saved.apiBase) {
      apiInput.value = saved.apiBase;
    }
    emailButton.disabled = !page.canFillEmail;
    otpButton.disabled = !page.canFillOtp;
    autoOtpButton.disabled = !page.canFillOtp || !saved.autoOtp;
    profileButton.disabled = !page.canFillProfile;
    inputHint.textContent = saved.autoOtp
      ? 'Outlook 行模式：验证码页会通过本地 API 自动收码'
      : '单邮箱模式：验证码需要手动输入';
  };

  accountInput.addEventListener('input', async () => {
    const saved = await controller.saveInput(accountInput.value);
    inputHint.textContent = saved.autoOtp
      ? 'Outlook 行模式：验证码页会通过本地 API 自动收码'
      : '单邮箱模式：验证码需要手动输入';
  });

  apiInput.addEventListener('change', async () => {
    const value = apiInput.value.trim() || 'http://127.0.0.1:8787';
    await controller.saveInput(accountInput.value);
    // 保存 API 地址到 state
    const { saveRegisterState } = await import('../../app/state');
    await saveRegisterState({ apiBase: value });
    setStatus(status, `收码地址已保存：${value}`, 'ok');
  });

  emailButton.addEventListener('click', async () => {
    setStatus(status, '正在提交邮箱...', 'pending');
    await controller.saveInput(accountInput.value);
    setResult(status, await controller.fillEmailFromInput());
    await update();
  });

  otpButton.addEventListener('click', async () => {
    setStatus(status, '正在提交验证码...', 'pending');
    setResult(status, await controller.fillOtp(otp.value));
    await update();
  });

  autoOtpButton.addEventListener('click', async () => {
    setStatus(status, '等待 Outlook 验证码...', 'pending');
    setResult(status, await controller.waitForOutlookOtp());
    await update();
  });

  profileButton.addEventListener('click', async () => {
    setStatus(status, '正在填写资料...', 'pending');
    setResult(status, await controller.fillProfileAndCreate());
    await update();
  });

  container.append(accountInput, inputHint, emailButton, otp, otpButton, autoOtpButton, profileButton, apiSection, status);
  void update();
  return { update };
}

function createButton(label: string, className = 'opx-button'): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = label;
  return button;
}

function setResult(element: HTMLElement, result: { ok: boolean; message: string }): void {
  setStatus(element, result.message, result.ok ? 'ok' : 'error');
}

function setStatus(element: HTMLElement, message: string, type: 'pending' | 'ok' | 'error'): void {
  element.textContent = message;
  element.dataset.type = type;
}
