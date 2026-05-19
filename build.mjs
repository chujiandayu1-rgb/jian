import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const outdir = '.output/chrome-mv3';

// Clean output
fs.rmSync(outdir, { recursive: true, force: true });
fs.mkdirSync(outdir, { recursive: true });
fs.mkdirSync(path.join(outdir, 'content-scripts'), { recursive: true });
fs.mkdirSync(path.join(outdir, 'icon'), { recursive: true });

// Build content script
await esbuild.build({
  entryPoints: ['entrypoints/content.ts'],
  bundle: true,
  outfile: path.join(outdir, 'content-scripts/content.js'),
  format: 'iife',
  target: 'chrome110',
  define: {
    'browser.runtime.sendMessage': 'chrome.runtime.sendMessage',
    'browser.storage.local.get': 'chrome.storage.local.get',
    'browser.storage.local.set': 'chrome.storage.local.set',
    'browser.storage.onChanged.addListener': 'chrome.storage.onChanged.addListener',
  },
  banner: {
    js: `// WXT globals shim
const browser = chrome;
function defineContentScript(opts) { opts.main(); }
`,
  },
});

// Build background script
await esbuild.build({
  entryPoints: ['entrypoints/background.ts'],
  bundle: true,
  outfile: path.join(outdir, 'background.js'),
  format: 'esm',
  target: 'chrome110',
  banner: {
    js: `// WXT globals shim
const browser = chrome;
function defineBackground(fn) { fn(); }
`,
  },
});

// Generate manifest.json (MV3)
const manifest = {
  manifest_version: 3,
  name: 'OpenAI Plus VXT',
  version: '0.0.3',
  description: 'ChatGPT registration assistant extension with one-click automation',
  permissions: ['storage', 'tabs', 'scripting'],
  host_permissions: [
    'http://127.0.0.1:8787/*',
    'http://localhost:8787/*',
    'https://auth.openai.com/*',
    'https://chatgpt.com/*',
    'https://pay.openai.com/*',
    'https://www.paypal.com/*',
    'https://paypal.com/*',
    'https://www.meiguodizhi.com/*',
    'https://api.github.com/*',
    'https://mail-api.yuecheng.shop/*',
  ],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://chatgpt.com/*',
        'https://auth.openai.com/*',
        'https://pay.openai.com/*',
        'https://www.paypal.com/*',
        'https://paypal.com/*',
      ],
      js: ['content-scripts/content.js'],
      run_at: 'document_idle',
    },
  ],
  icons: {
    16: 'icon/16.png',
    32: 'icon/32.png',
    48: 'icon/48.png',
    96: 'icon/96.png',
    128: 'icon/128.png',
  },
  action: {
    default_icon: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
    },
    default_title: 'OpenAI Plus VXT',
  },
};

fs.writeFileSync(
  path.join(outdir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

// Copy icons
const iconDir = 'public/icon';
if (fs.existsSync(iconDir)) {
  for (const file of fs.readdirSync(iconDir)) {
    fs.copyFileSync(path.join(iconDir, file), path.join(outdir, 'icon', file));
  }
}

console.log('Build complete! Extension at:', outdir);
