import { PoliceLoginBlockedReason } from 'src/constants/police-provisioning.constants';

export type PoliceLoginChallengeResponse = {
  message: string;
  requiresPasswordChange: true;
  challengeToken: string;
};

/** Officer already set a password but has not finished email OTP activation. */
export type PoliceLoginOtpResumeResponse = {
  message: string;
  requiresActivationOtp: true;
  challengeToken: string;
};

export type PoliceLoginChallengeResult =
  | PoliceLoginChallengeResponse
  | PoliceLoginOtpResumeResponse;

export type PoliceLoginBlockedExceptionBody = {
  message: string;
  code: PoliceLoginBlockedReason;
};

export const POLICE_ACTIVATION_CHALLENGE_TTL_SECONDS = 15 * 60;
export const POLICE_ACTIVATION_OTP_TTL_SECONDS = 5 * 60;
export const POLICE_ACTIVATION_MAX_OTP_VERIFY_ATTEMPTS = 5;
export const POLICE_ACTIVATION_MAX_OTP_SENDS_PER_HOUR = 3;

export const policeActivationChallengeKey = (token: string) =>
  `police:activation:challenge:${token}`;

export const policeActivationOtpKey = (token: string) =>
  `police:activation:otp:${token}`;

export const policeActivationOtpVerifyKey = (token: string) =>
  `police:activation:otp:verify:${token}`;
