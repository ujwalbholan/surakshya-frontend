"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  setGuardianActivationPassword,
  verifyGuardianActivationOtp,
} from "@/lib/api/auth"
import { isApiError } from "@/lib/api/client"
import {
  clearGuardianActivationSession,
  loadGuardianActivationSession,
  type GuardianActivationSession,
} from "@/lib/auth/guardian-activation-session"

const MIN_PASSWORD_LENGTH = 8

type Step = "password" | "otp" | "done"

export default function GuardianActivateWizard() {
  const router = useRouter()
  const [session, setSession] = useState<GuardianActivationSession | null>(null)
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<Step>("password")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadGuardianActivationSession()
    setSession(stored)
    if (stored?.startAtOtp) {
      setStep("otp")
      setInfo("We sent a verification code to your phone. Enter it below.")
    }
    setReady(true)
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || loading) return
    setError(null)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const result = await setGuardianActivationPassword(
        session.challengeToken,
        password
      )
      setInfo(result.message)
      setStep("otp")
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : "Could not update password. Sign in again to restart activation."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || loading) return
    setError(null)

    if (!/^\d{4,6}$/.test(otp.trim())) {
      setError("Enter the 4–6 digit code from your phone.")
      return
    }

    setLoading(true)
    try {
      await verifyGuardianActivationOtp(session.challengeToken, otp.trim())
      clearGuardianActivationSession()
      setStep("done")
      setTimeout(() => {
        router.push("/login?activated=1")
      }, 1800)
    } catch (err) {
      setError(isApiError(err) ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C0392B]" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center">
        <h1 className="text-xl font-semibold text-[#FAFAFA]">
          Activation session expired
        </h1>
        <p className="mt-2 max-w-md text-sm text-[#888]">
          Sign in with the temporary password from your invite email to start
          activation again.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="mt-6 text-xs uppercase tracking-wider text-[#C0392B] underline"
        >
          Go to login
        </button>
      </div>
    )
  }

  const stepNumber = step === "password" ? 1 : step === "otp" ? 2 : 3

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#222] bg-[#0a0a0a] p-8">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C0392B]">
            Surakshya Guardian Portal
          </p>
          <h1 className="mt-2 text-xl font-semibold text-[#FAFAFA]">
            Activate your account
          </h1>
          <p className="mt-1 text-xs text-[#666]">
            {session.email} · Step {stepNumber} of 3
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${
                s <= stepNumber ? "bg-[#C0392B]" : "bg-[#222]"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded border border-[#C0392B]/40 bg-[#C0392B]/10 px-3 py-2 text-sm text-[#ff8a7a]">
            {error}
          </p>
        )}
        {info && !error && (
          <p className="mb-4 rounded border border-[#333] bg-[#111] px-3 py-2 text-sm text-[#aaa]">
            {info}
          </p>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              You signed in with a temporary password. Choose a new permanent
              password, then verify your phone.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#C0392B]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#C0392B]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#C0392B] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Enter the verification code sent to your registered phone number.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                Phone OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-[#FAFAFA] outline-none focus:border-[#C0392B]"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#C0392B] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify and activate
            </button>
            <button
              type="button"
              onClick={() => {
                clearGuardianActivationSession()
                router.push("/login")
              }}
              className="w-full text-center text-xs text-[#666] underline"
            >
              Back to login
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm text-[#ccc]">
              Account activated. Redirecting you to sign in…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
