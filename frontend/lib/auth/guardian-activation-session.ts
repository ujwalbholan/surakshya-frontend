export const GUARDIAN_ACTIVATION_STORAGE_KEY = "surakshya_guardian_activation"

export type GuardianActivationSession = {
  challengeToken: string
  email: string
  /** When true, skip password step and show phone OTP. */
  startAtOtp: boolean
}

export function saveGuardianActivationSession(
  session: GuardianActivationSession
) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(
    GUARDIAN_ACTIVATION_STORAGE_KEY,
    JSON.stringify(session)
  )
}

export function loadGuardianActivationSession(): GuardianActivationSession | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(GUARDIAN_ACTIVATION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as GuardianActivationSession
    if (
      !parsed ||
      typeof parsed.challengeToken !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null
    }
    return {
      challengeToken: parsed.challengeToken,
      email: parsed.email,
      startAtOtp: Boolean(parsed.startAtOtp),
    }
  } catch {
    return null
  }
}

export function clearGuardianActivationSession() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(GUARDIAN_ACTIVATION_STORAGE_KEY)
}
