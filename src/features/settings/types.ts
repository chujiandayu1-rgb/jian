import type { AddressProfile } from '../address-autofill/types';

export interface ExtensionSettings {
  addressAutofill: AddressAutofillSettings;
  paypalAccount: PaypalAccountSettings;
  updatedAt: number;
}

export interface AddressAutofillSettings {
  payOpenAiEnabled: boolean;
  payPalSignupEnabled: boolean;
  countryCode: string;
  city: string;
  lastAddress: AddressProfile | null;
  updatedAt: number;
}

// PayPal 已有账号登录授权(从 pay.openai 跳过来,自动填邮箱密码并点同意)
export interface PaypalAccountSettings {
  email: string;
  password: string;
  updatedAt: number;
}
