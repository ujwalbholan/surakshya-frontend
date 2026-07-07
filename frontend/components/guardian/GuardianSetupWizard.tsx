"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  guardianSendOtp,
  guardianSetPassword,
  guardianVerifyOtp,
} from "@/lib/api/guardian"
import { isApiError } from "@/lib/api/client"

const MIN_PASSWORD_LENGTH = 8
const OTP_COOLDOWN_SECONDS = 30

type Step = 1 | 2 | 3 | 4

interface GuardianSetupWizardProps {
  initialEmail?: string
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function GuardianSetupWizard({
  initialEmail = "",
}: GuardianSetupWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendOtp = useCallback(async () => {
    const normalized = normalizeEmail(email)
    if (!isValidEmail(normalized)) {
      setError("Enter a valid email address.")
      return
    }

    setError(null)
    setLoading(true)
    try {
      await guardianSendOtp(normalized)
      setEmail(normalized)
      setCooldown(OTP_COOLDOWN_SECONDS)
      setStep(2)
    } catch (err) {
      setError(isApiError(err) ? err.message : "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }, [email])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendOtp()
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedOtp = otp.trim()
    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError("Enter the 6-digit code from your SMS.")
      return
    }

    setLoading(true)
    try {
      await guardianVerifyOtp(normalizeEmail(email), trimmedOtp)
      setStep(3)
    } catch (err) {
      setError(isApiError(err) ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!oldPassword.trim()) {
      setError("Enter the temporary password from your invitation email.")
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      await guardianSetPassword(
        normalizeEmail(email),
        oldPassword,
        newPassword
      )
      setStep(4)
      setTimeout(() => {
        router.push("/login?activated=1")
      }, 2000)
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : "Could not update your password. Check your temporary password and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#222] bg-[#0a0a0a] p-8">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#2563eb]">
            Surakshya Guardian Portal
          </p>
          <h1 className="mt-2 text-xl font-semibold text-[#FAFAFA]">
            Account setup
          </h1>
          <p className="mt-1 text-xs text-[#666]">Step {step} of 4</p>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${
                s <= step ? "bg-[#2563eb]" : "bg-[#222]"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Enter the email address from your guardian invitation. We will send
              a verification code to your registered phone number.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#2563eb]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#2563eb] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Enter the verification code sent to the phone registered for{" "}
              <span className="text-[#FAFAFA]">{normalizeEmail(email)}</span>.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                OTP code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-center font-mono text-lg tracking-widest text-[#FAFAFA] outline-none focus:border-[#2563eb]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#2563eb] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify phone
            </button>
            <button
              type="button"
              disabled={loading || cooldown > 0}
              onClick={() => void sendOtp()}
              className="w-full text-xs text-[#888] underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setError(null)
                setOtp("")
                setStep(1)
              }}
              className="w-full text-xs text-[#666] underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Phone verified. Set a new password using the temporary password
              from your invitation email.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                Temporary password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#2563eb]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                Confirm new password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#2563eb]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#2563eb] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Set password
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-sm text-[#FAFAFA]">
              Account ready — redirecting to login…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
