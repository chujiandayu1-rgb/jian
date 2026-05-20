import type { FeaturePanelHandle } from '../../app/types';
import {
  loadOrchestratorState,
  onOrchestratorStateChange,
  resetOrchestrator,
  startOrchestrator,
  stopOrchestrator,
} from './orchestrator';
import { STEP_LABELS } from './types';
import type { OrchestratorState, OrchestratorStep } from './types';

export function createAutoPanel(container: HTMLElement): FeaturePanelHandle {
  const wrapper = document.createElement('div');
  wrapper.className = 'opx-auto-panel';

  // --- 标题描述 ---
  const desc = document.createElement('div');
  desc.className = 'opx-hint';
  desc.textContent = '一键自动化：输入 Outlook 账号后点击开始，全流程自动执行。';

  // --- 控制按钮 ---
  const buttonRow = document.createElement('div');
  buttonRow.className = 'opx-button-row';
  buttonRow.style.marginTop = '12px';

  const startButton = document.createElement('button');
  startButton.className = 'opx-button';
  startButton.type = 'button';
  startButton.textContent = '一键开始';

  const stopButton = document.createElement('button');
  stopButton.className = 'opx-button opx-button-secondary';
  stopButton.type = 'button';
  stopButton.textContent = '停止';
  stopButton.disabled = true;

  const resetButton = document.createElement('button');
  resetButton.className = 'opx-button opx-button-secondary';
  resetButton.type = 'button';
  resetButton.textContent = '重置';

  buttonRow.append(startButton, stopButton, resetButton);

  // --- 状态显示 ---
  const statusBox = document.createElement('div');
  statusBox.className = 'opx-status';
  statusBox.style.marginTop = '12px';
  statusBox.textContent = '等待开始';

  // --- 步骤列表 ---
  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'opx-steps-list';
  stepsContainer.style.marginTop = '12px';

  const allSteps: OrchestratorStep[] = [
    'fill-email',
    'wait-otp',
    'fill-profile',
    'fetch-session',
    'generate-link',
    'open-checkout',
    'wait-payment-page',
    'wait-paypal-sms',
  ];

  const stepElements: Record<string, HTMLElement> = {};
  for (const step of allSteps) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;color:#94a3b8;';
    const icon = document.createElement('span');
    icon.style.cssText = 'width:16px;text-align:center;';
    icon.textContent = '\u25CB'; // ○
    const label = document.createElement('span');
    label.textContent = STEP_LABELS[step];
    row.append(icon, label);
    stepsContainer.append(row);
    stepElements[step] = row;
  }

  // --- 链接输出 ---
  const linkOutput = document.createElement('div');
  linkOutput.className = 'opx-hint';
  linkOutput.style.marginTop = '8px';
  linkOutput.style.wordBreak = 'break-all';

  wrapper.append(desc, buttonRow, statusBox, stepsContainer, linkOutput);
  container.append(wrapper);

  // --- 事件绑定 ---
  startButton.addEventListener('click', async () => {
    startButton.disabled = true;
    stopButton.disabled = false;
    await startOrchestrator();
  });

  stopButton.addEventListener('click', async () => {
    stopButton.disabled = true;
    startButton.disabled = false;
    await stopOrchestrator();
  });

  resetButton.addEventListener('click', async () => {
    await resetOrchestrator();
    startButton.disabled = false;
    stopButton.disabled = true;
  });

  // --- 监听状态变化 ---
  onOrchestratorStateChange((state) => {
    renderState(state);
  });

  function renderState(state: OrchestratorState): void {
    // 按钮状态
    startButton.disabled = state.enabled;
    stopButton.disabled = !state.enabled;

    // 状态文字
    statusBox.textContent = state.statusMessage;
    statusBox.dataset.type = state.currentStep === 'error' ? 'error' : state.currentStep === 'done' ? 'ok' : 'pending';

    // 步骤列表
    for (const step of allSteps) {
      const row = stepElements[step];
      const icon = row?.firstElementChild as HTMLElement;
      if (!row || !icon) {
        continue;
      }

      if (state.completedSteps.includes(step)) {
        icon.textContent = '\u2714'; // ✔
        row.style.color = '#10b981';
      } else if (state.currentStep === step) {
        icon.textContent = '\u25CF'; // ●
        row.style.color = '#f59e0b';
      } else {
        icon.textContent = '\u25CB'; // ○
        row.style.color = '#94a3b8';
      }
    }

    // 链接
    if (state.generatedLink) {
      linkOutput.textContent = `订阅链接：${state.generatedLink}`;
    } else {
      linkOutput.textContent = '';
    }
  }

  const update = async () => {
    const state = await loadOrchestratorState();
    renderState(state);
  };

  void update();
  return { update };
}

const DEFAULT_RENDER_STATE: OrchestratorState = {
  enabled: false,
  paused: false,
  currentStep: 'idle',
  statusMessage: '等待开始',
  startedAt: 0,
  completedSteps: [],
  lastError: '',
  generatedLink: '',
  updatedAt: 0,
};
