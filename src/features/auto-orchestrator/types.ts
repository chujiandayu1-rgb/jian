export type OrchestratorStep =
  | 'idle'
  | 'fill-email'
  | 'wait-otp'
  | 'fill-profile'
  | 'fetch-session'
  | 'generate-link'
  | 'open-checkout'
  | 'wait-payment-page'
  | 'paypal-login'
  | 'wait-paypal-return'
  | 'wait-paypal-sms'
  | 'done'
  | 'error';

export interface OrchestratorState {
  enabled: boolean;
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
  'paypal-login': 'PayPal 登录授权',
  'wait-paypal-return': '等待回跳确认',
  'wait-paypal-sms': '等待 PayPal 短信验证',
  'done': '全流程完成',
  'error': '出错',
};
