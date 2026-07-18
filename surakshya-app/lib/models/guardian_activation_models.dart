library guardian_activation_models;

class GuardianLoginChallenge {
  const GuardianLoginChallenge({
    required this.email,
    required this.challengeToken,
    required this.message,
    required this.requiresPasswordChange,
    required this.requiresActivationOtp,
  });

  final String email;
  final String challengeToken;
  final String message;
  final bool requiresPasswordChange;
  final bool requiresActivationOtp;
}

class GuardianOtpVerifyResult {
  const GuardianOtpVerifyResult({
    required this.message,
    required this.requiresPasswordChange,
  });

  final String message;
  final bool requiresPasswordChange;
}
