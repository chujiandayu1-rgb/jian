import { checkLatestVersion } from '../version-check/github';
import {
  loadAddressAutofillSettings,
  loadPaypalAccountSettings,
  saveAddressAutofillSettings,
  savePaypalAccountSettings,
} from './state';

const TG_GROUP_URL = 'https://t.me/fuck_open';

export interface SettingsDialogOptions {
  onVersionChecked?: () => Promise<void> | void;
}

export interface SettingsDialogHandle {
  element: HTMLElement;
  open(): void;
  update(): Promise<void>;
}

export function createSettingsDialog(options: SettingsDialogOptions = {}): SettingsDialogHandle {
  const overlay = document.createElement('div');
  overlay.className = 'opx-settings-overlay';
  overlay.hidden = true;

  const dialog = document.createElement('section');
  dialog.className = 'opx-settings-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', '插件设置');

  const header = document.createElement('div');
  header.className = 'opx-settings-header';
  const titleGroup = document.createElement('div');
  titleGroup.className = 'opx-settings-title';
  const title = document.createElement('strong');
  title.textContent = '设置';
  const version = document.createElement('span');
  version.className = 'opx-version-badge';
  version.textContent = `v${browser.runtime.getManifest().version}`;
  const closeButton = createIconButton('×', '关闭设置');
  titleGroup.append(title, version);
  header.append(titleGroup, closeButton);

  const payOpenAiCheckbox = document.createElement('input');
  payOpenAiCheckbox.type = 'checkbox';
  payOpenAiCheckbox.className = 'opx-checkbox';

  const payPalSignupCheckbox = document.createElement('input');
  payPalSignupCheckbox.type = 'checkbox';
  payPalSignupCheckbox.className = 'opx-checkbox';

  const payOpenAiItem = createSettingItem(
    payOpenAiCheckbox,
    'OpenAI 支付页自动填写',
    '用于 pay.openai.com/c/pay 页面，填写姓名、国家、地址、邮编、电话并勾选条款。',
  );
  const payPalSignupItem = createSettingItem(
    payPalSignupCheckbox,
    'PayPal 注册页自动填写',
    '用于 paypal.com/checkoutweb/signup 页面，填写国家、邮箱、卡资料、姓名、地址和密码提示。',
  );

  // PayPal 已有账号(用于 pay.openai → paypal.com 登录授权步骤)
  const paypalAccountSection = document.createElement('div');
  paypalAccountSection.className = 'opx-setting-item';
  const paypalAccountTitle = document.createElement('div');
  paypalAccountTitle.style.cssText = 'font-weight:600;font-size:13px;margin-bottom:4px;';
  paypalAccountTitle.textContent = 'PayPal 登录账号(自动授权用)';
  const paypalAccountDesc = document.createElement('div');
  paypalAccountDesc.className = 'opx-setting-description';
  paypalAccountDesc.textContent = '从 pay.openai 跳转到 paypal.com 时自动填邮箱、密码并点同意并继续。';

  const paypalEmailInput = document.createElement('input');
  paypalEmailInput.type = 'email';
  paypalEmailInput.className = 'opx-input';
  paypalEmailInput.placeholder = 'PayPal 邮箱';
  paypalEmailInput.style.cssText = 'width:100%;margin-top:6px;padding:6px 8px;font-size:12px;box-sizing:border-box;';
  paypalEmailInput.autocomplete = 'off';

  const paypalPasswordInput = document.createElement('input');
  paypalPasswordInput.type = 'password';
  paypalPasswordInput.className = 'opx-input';
  paypalPasswordInput.placeholder = 'PayPal 密码';
  paypalPasswordInput.style.cssText = 'width:100%;margin-top:6px;padding:6px 8px;font-size:12px;box-sizing:border-box;';
  paypalPasswordInput.autocomplete = 'off';

  paypalAccountSection.append(paypalAccountTitle, paypalAccountDesc, paypalEmailInput, paypalPasswordInput);

  paypalEmailInput.addEventListener('change', async () => {
    await savePaypalAccountSettings({ email: paypalEmailInput.value.trim() });
    setStatus(status, 'PayPal 账号已保存', 'ok');
  });
  paypalPasswordInput.addEventListener('change', async () => {
    await savePaypalAccountSettings({ password: paypalPasswordInput.value });
    setStatus(status, 'PayPal 密码已保存', 'ok');
  });

  const checkUpdateButton = document.createElement('button');
  checkUpdateButton.className = 'opx-external-link-button';
  checkUpdateButton.type = 'button';
  checkUpdateButton.title = '立即检查 GitHub Release 最新版本';
  checkUpdateButton.textContent = '检测更新';

  const tgGroupButton = document.createElement('button');
  tgGroupButton.className = 'opx-external-link-button';
  tgGroupButton.type = 'button';
  tgGroupButton.title = '打开 TG 群组';
  tgGroupButton.append(createTelegramIcon(), document.createTextNode('TG 群组：t.me/fuck_open'));

  const hint = document.createElement('div');
  hint.className = 'opx-hint';
  hint.textContent = '国家、城市和获取地址在“地址”tab 中操作。';

  const status = document.createElement('div');
  status.className = 'opx-status';

  dialog.append(header, payOpenAiItem, payPalSignupItem, paypalAccountSection, checkUpdateButton, tgGroupButton, hint, status);
  overlay.append(dialog);

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  payOpenAiCheckbox.addEventListener('change', async () => {
    await saveAddressAutofillSettings({ payOpenAiEnabled: payOpenAiCheckbox.checked });
    setStatus(status, '设置已保存', 'ok');
  });
  payPalSignupCheckbox.addEventListener('change', async () => {
    await saveAddressAutofillSettings({ payPalSignupEnabled: payPalSignupCheckbox.checked });
    setStatus(status, '设置已保存', 'ok');
  });
  tgGroupButton.addEventListener('click', () => {
    window.open(TG_GROUP_URL, '_blank', 'noopener,noreferrer');
  });
  checkUpdateButton.addEventListener('click', async () => {
    checkUpdateButton.disabled = true;
    setStatus(status, '正在检测 GitHub 最新版本...', 'pending');
    try {
      const result = await checkLatestVersion(true);
      await options.onVersionChecked?.();
      if (result.latest && result.updateAvailable) {
        setStatus(status, `发现新版本 v${result.latest.version}，顶部已显示更新提示`, 'ok');
      } else if (result.latest) {
        setStatus(status, `当前已是最新版本 v${result.currentVersion}`, 'ok');
      } else {
        setStatus(status, result.error || '暂未找到可用 Release', 'pending');
      }
    } catch (error) {
      setStatus(status, error instanceof Error ? error.message : String(error), 'error');
    } finally {
      checkUpdateButton.disabled = false;
    }
  });

  const update = async () => {
    const settings = await loadAddressAutofillSettings();
    payOpenAiCheckbox.checked = settings.payOpenAiEnabled;
    payPalSignupCheckbox.checked = settings.payPalSignupEnabled;
    const paypal = await loadPaypalAccountSettings();
    paypalEmailInput.value = paypal.email || '';
    paypalPasswordInput.value = paypal.password || '';
    const enabledCount = Number(settings.payOpenAiEnabled) + Number(settings.payPalSignupEnabled);
    const paypalConfigured = paypal.email && paypal.password;
    const statusText = paypalConfigured
      ? `已开启 ${enabledCount} 项自动填写,PayPal 账号已配置`
      : enabledCount > 0
        ? `已开启 ${enabledCount} 项自动填写(尚未配置 PayPal 账号)`
        : '自动填写未开启';
    setStatus(status, statusText, enabledCount > 0 ? 'ok' : 'pending');
  };

  return {
    element: overlay,
    open: () => {
      overlay.hidden = false;
      void update();
    },
    update,
  };

  function close(): void {
    overlay.hidden = true;
  }
}

function createSettingItem(checkbox: HTMLInputElement, title: string, description: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'opx-setting-item';

  const label = document.createElement('label');
  label.className = 'opx-check-row';
  const titleElement = document.createElement('span');
  titleElement.textContent = title;
  label.append(checkbox, titleElement);

  const descriptionElement = document.createElement('div');
  descriptionElement.className = 'opx-setting-description';
  descriptionElement.textContent = description;

  item.append(label, descriptionElement);
  return item;
}

function createTelegramIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('opx-telegram-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M21.9 4.3 18.7 19c-.2 1-.8 1.2-1.6.8l-4.6-3.4-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7.1 12.9 2.6 11.5c-1-.3-1-1 0-1.4L20.2 3.3c.8-.3 1.5.2 1.7 1Z');
  svg.append(path);
  return svg;
}

function createIconButton(label: string, title: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'opx-icon-button';
  button.type = 'button';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-label', title);
  return button;
}

function setStatus(element: HTMLElement, message: string, type: 'pending' | 'ok' | 'error'): void {
  element.textContent = message;
  element.dataset.type = type;
}
