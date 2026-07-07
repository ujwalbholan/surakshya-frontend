"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  sendPoliceOtp,
  setPolicePassword,
  verifyPoliceOtp,
} from "@/lib/api/police-setup"
import { isApiError } from "@/lib/api/client"

const MIN_PASSWORD_LENGTH = 8
const OTP_COOLDOWN_SECONDS = 30

type Step = 1 | 2 | 3

interface PoliceSetupWizardProps {
  token: string
}

export default function PoliceSetupWizard({ token }: PoliceSetupWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sendOtp = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      await sendPoliceOtp(token)
      setOtpSent(true)
      setCooldown(OTP_COOLDOWN_SECONDS)
    } catch (err) {
      setError(isApiError(err) ? err.message : "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (step === 2 && !otpSent && !loading) {
      void sendOtp()
    }
  }, [step, otpSent, loading, sendOtp])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await setPolicePassword(token, password)
      setStep(2)
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : "This invite link is invalid or has expired"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!/^\d{4,6}$/.test(otp.trim())) {
      setError("Enter the 4–6 digit code from your SMS.")
      return
    }

    setLoading(true)
    try {
      await verifyPoliceOtp(token, otp.trim())
      setStep(3)
      setTimeout(() => {
        router.push("/login?activated=1")
      }, 2000)
    } catch (err) {
      setError(isApiError(err) ? err.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-[#222] bg-[#0a0a0a] p-8">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C0392B]">
            Surakshya Police Portal
          </p>
          <h1 className="mt-2 text-xl font-semibold text-[#FAFAFA]">Account setup</h1>
          <p className="mt-1 text-xs text-[#666]">Step {step} of 3</p>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded ${
                s <= step ? "bg-[#C0392B]" : "bg-[#222]"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Set a new password for your account. You will verify your phone next.
            </p>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-[#666]">
                New password
              </label>
              <input
                type="password"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-sm text-[#FAFAFA] outline-none focus:border-[#C0392B]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#C0392B] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-[#888]">
              Enter the verification code sent to your registered phone number.
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
                className="w-full rounded border border-[#333] bg-[#080808] px-3 py-2.5 text-center font-mono text-lg tracking-widest text-[#FAFAFA] outline-none focus:border-[#C0392B]"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#C0392B] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verify & activate
            </button>
            <button
              type="button"
              disabled={loading || cooldown > 0}
              onClick={() => void sendOtp()}
              className="w-full text-xs text-[#888] underline disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-sm text-[#FAFAFA]">
              Account activated — redirecting to login…
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
