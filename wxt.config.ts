import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: [
      'http://*/*',
      'https://*/*',
    ],
  },
});
