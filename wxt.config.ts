import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: [
      // OpenAI / ChatGPT
      'https://auth.openai.com/*',
      'https://chatgpt.com/*',
      'https://pay.openai.com/*',
      // PayPal
      'https://www.paypal.com/*',
      'https://paypal.com/*',
      // 工具站
      'https://www.meiguodizhi.com/*',
      'https://api.github.com/*',
      // 邮件 API（唯一一个）
      'http://www.yxiang6.com/*',
      'http://yxiang6.com/*',
    ],
  },
});
