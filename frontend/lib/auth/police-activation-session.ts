export const POLICE_ACTIVATION_STORAGE_KEY = "surakshya_police_activation"

export type PoliceActivationSession = {
  challengeToken: string
  email: string
  /** When true, skip password step and show email OTP. */
  startAtOtp: boolean
}

export function savePoliceActivationSession(session: PoliceActivationSession) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(POLICE_ACTIVATION_STORAGE_KEY, JSON.stringify(session))
}

export function loadPoliceActivationSession(): PoliceActivationSession | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(POLICE_ACTIVATION_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PoliceActivationSession
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

export function clearPoliceActivationSession() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(POLICE_ACTIVATION_STORAGE_KEY)
}
