export const ADMIN_SETTING_KEYS = [
  'platform_name',
  'support_email',
  'language',
  'session_timeout',
  'api_url',
  'api_timeout',
  'notifications',
] as const;

export type AdminSettingKey = (typeof ADMIN_SETTING_KEYS)[number];

export const ADMIN_SETTINGS_DEFAULTS: Record<AdminSettingKey, unknown> = {
  platform_name: 'Suraksha',
  support_email: 'support@suraksha.com.np',
  language: 'English',
  session_timeout: '30 min',
  api_url: 'https://surakshya.onrender.com',
  api_timeout: '10s',
  notifications: {
    newSos: { email: true, push: true, sms: false },
    sosUnack: { email: true, push: true, sms: true },
    newUser: { email: true, push: false, sms: false },
    caseChange: { email: false, push: true, sms: false },
    systemHealth: { email: true, push: true, sms: false },
  },
};
