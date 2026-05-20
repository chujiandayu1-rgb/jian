export type OrchestratorStep =
  | 'idle'
  | 'fill-email'
  | 'wait-otp'
  | 'fill-profile'
  | 'fetch-session'
  | 'generate-link'
  | 'open-checkout'
  | 'wait-payment-page'
  | 'wait-paypal-sms'
  | 'done'
  | 'error';

export interface OrchestratorState {
  enabled: boolean;
  /**
   * 用户主动点了"停止"或"重置"。一旦为 true，所有自动填写模块（pay.openai 地址自动填写、
   * PayPal 注册页自动填写）都会跳过工作，直到用户重新点"一键开始"。
   */
  paused: boolean;
  currentStep: OrchestratorStep;
  statusMessage: string;
  startedAt: number;
  completedSteps: OrchestratorStep[];
  lastError: string;
  generatedLink: string;
  updatedAt: number;
}

export interface OrchestratorEvent {
  type: 'opx:orchestrator-state-changed';
  state: OrchestratorState;
}

export const STEP_LABELS: Record<OrchestratorStep, string> = {
  'idle': '等待开始',
  'fill-email': '填入邮箱',
  'wait-otp': '等待验证码',
  'fill-profile': '填写资料',
  'fetch-session': '读取 Session',
  'generate-link': '生成订阅链接',
  'open-checkout': '打开支付页',
  'wait-payment-page': '等待支付页填写',
  'wait-paypal-sms': '等待 PayPal 短信验证',
  'done': '全流程完成',
  'error': '出错',
};
