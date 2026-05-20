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

  const apiBaseLabel = document.createElement('div');
  apiBaseLabel.className = 'opx-label';
  apiBaseLabel.textContent = '收码 API 地址（别人使用需修改）';

  const apiBaseInput = document.createElement('input');
  apiBaseInput.className = 'opx-input';
  apiBaseInput.type = 'text';
  apiBaseInput.placeholder = 'http://127.0.0.1:8787';
  apiBaseInput.autocomplete = 'off';
  apiBaseInput.spellcheck = false;

  const apiBaseHint = document.createElement('div');
  apiBaseHint.className = 'opx-hint';
  apiBaseHint.textContent = '⚠ 默认为本机地址，其他人使用需要改为公网收码服务地址';

  const status = document.createElement('div');
  status.className = 'opx-status';
  status.textContent = '等待操作';

  // Track which fields are currently being edited so the periodic update()
  // doesn't clobber the user's keystrokes.
  // We use a simple Set + focus/blur/input events. We do NOT rely on
  // document.activeElement because the panel lives inside a ShadowRoot
  // and document.activeElement won't point to shadow DOM elements.
  const focused = new Set<HTMLElement>();
  const dirty = new Set<HTMLElement>();
  const trackEditing = (el: HTMLInputElement | HTMLTextAreaElement) => {
    el.addEventListener('focus', () => focused.add(el));
    el.addEventListener('blur', () => { focused.delete(el); dirty.delete(el); });
    el.addEventListener('input', () => dirty.add(el));
    el.addEventListener('compositionstart', () => focused.add(el));
    el.addEventListener('compositionend', () => focused.add(el));
  };
  trackEditing(accountInput);
  trackEditing(otp);
  trackEditing(apiBaseInput);

  const isEditing = (el: HTMLElement) => focused.has(el) || dirty.has(el);

  const update = async () => {
    const page = controller.getPageState();
    const saved = await controller.loadState();

    // Only sync external state into the input if the user is NOT
    // currently focused on it or has unsaved changes (dirty).
    if (!isEditing(accountInput)) {
      if (accountInput.value !== saved.rawInput) {
        accountInput.value = saved.rawInput;
      }
    }
    if (!isEditing(apiBaseInput)) {
      if (apiBaseInput.value !== saved.apiBase) {
        apiBaseInput.value = saved.apiBase;
      }
    }

    emailButton.disabled = !page.canFillEmail;
    otpButton.disabled = !page.canFillOtp;
    autoOtpButton.disabled = !page.canFillOtp || !saved.autoOtp;
    profileButton.disabled = !page.canFillProfile;
    inputHint.textContent = saved.autoOtp
      ? 'Outlook 行模式：验证码页会通过本地 API 自动收码'
      : '单邮箱模式：验证码需要手动输入';
  };

  accountInput.addEventListener('input', () => {
    // Save in the background. Don't await here — awaiting inside an `input`
    // listener can interleave with the next keystroke and the periodic
    // refresh, which previously made the field feel un-editable.
    void controller.saveInput(accountInput.value).then((saved) => {
      // After successfully saving, clear the dirty flag so next update()
      // can safely sync from storage (the value is now consistent).
      dirty.delete(accountInput);
      inputHint.textContent = saved.autoOtp
        ? 'Outlook 行模式：验证码页会通过本地 API 自动收码'
        : '单邮箱模式：验证码需要手动输入';
    });
  });

  apiBaseInput.addEventListener('input', () => {
    void controller.saveApiBase(apiBaseInput.value).then(() => {
      dirty.delete(apiBaseInput);
    });
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

  container.append(
    accountInput,
    inputHint,
    emailButton,
    otp,
    otpButton,
    autoOtpButton,
    profileButton,
    apiBaseLabel,
    apiBaseInput,
    apiBaseHint,
    status,
  );
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
