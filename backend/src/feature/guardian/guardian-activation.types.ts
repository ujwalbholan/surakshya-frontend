export type GuardianLoginChallengeResponse = {
  message: string;
  requiresPasswordChange: true;
  challengeToken: string;
  role: 'GUARDIAN';
};

export type GuardianLoginOtpResumeResponse = {
  message: string;
  requiresActivationOtp: true;
  challengeToken: string;
  role: 'GUARDIAN';
};

export type GuardianLoginChallengeResult =
  | GuardianLoginChallengeResponse
  | GuardianLoginOtpResumeResponse;

export const GUARDIAN_TEMP_PASSWORD_TTL_HOURS = 72;
export const GUARDIAN_ACTIVATION_CHALLENGE_TTL_SECONDS = 15 * 60;
export const GUARDIAN_ACTIVATION_OTP_TTL_SECONDS = 5 * 60;
export const GUARDIAN_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS = 5;
export const GUARDIAN_ACTIVATION_MAX_OTP_SENDS_PER_HOUR = 3;
export const GUARDIAN_ACTIVATION_PASSWORD_MIN_LENGTH = 8;

export const guardianActivationChallengeKey = (token: string) =>
  `guardian:activation:challenge:${token}`;

export const guardianActivationOtpKey = (token: string) =>
  `guardian:activation:otp:${token}`;

export const guardianActivationOtpVerifyKey = (token: string) =>
  `guardian:activation:otp:verify:${token}`;
