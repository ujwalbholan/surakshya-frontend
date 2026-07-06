"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import SurakshaShieldLogo from "@/components/admin/SurakshaShieldLogo"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { forgetPassword, resetPassword, verifyResetOtp } from "@/lib/api/admin-auth"

type Step = 1 | 2 | 3

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  const startCooldown = () => {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setEmailError(null)

    const { error, status } = await forgetPassword(email.trim())

    if (status === 0) {
      toast.error("Connection error. Please try again.")
      setSubmitting(false)
      return
    }

    if (error) {
      setEmailError("No account with this email")
      setSubmitting(false)
      return
    }

    setStep(2)
    startCooldown()
    setSubmitting(false)
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code")
      return
    }
    setSubmitting(true)
    setOtpError(null)

    const { data, error } = await verifyResetOtp(email.trim(), otp)

    if (error || !data?.resetToken) {
      setOtpError("Invalid or expired OTP")
      setSubmitting(false)
      return
    }

    setResetToken(data.resetToken)
    setStep(3)
    setSubmitting(false)
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    await forgetPassword(email.trim())
    startCooldown()
    toast.success("OTP resent to your email")
  }

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    setSubmitting(true)

    const { error } = await resetPassword({
      email: email.trim(),
      newPassword,
      comparePassword: confirmPassword,
      resetToken,
    })

    if (error) {
      setPasswordError(error)
      setSubmitting(false)
      return
    }

    toast.success("Password reset successfully")
    router.push("/admin/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#0A0A0A", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" },
        }}
      />

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <SurakshaShieldLogo size={48} />
          <h1 className="mt-4 font-display text-2xl italic text-white">Reset Password</h1>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${step >= s ? "bg-[#C0392B]" : "bg-white/20"}`}
            />
          ))}
        </div>

        <div className="admin-card">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <p className="font-body text-sm text-white/60">Enter your email to receive a reset code.</p>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm text-white/70">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  className="admin-input"
                  required
                />
                {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
              </div>
              <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <p className="font-body text-sm text-white/60">
                Enter the 6-digit code sent to <span className="text-white">{email}</span>
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className="border-white/20 bg-[#0A0A0A] text-white" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {otpError && <p className="text-center text-xs text-red-400">{otpError}</p>}
              <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Verify Code"}
              </button>
              <p className="text-center text-sm text-white/50">
                {cooldown > 0 ? (
                  `Resend in ${cooldown}s`
                ) : (
                  <button type="button" onClick={handleResend} className="text-[#C0392B] hover:underline">
                    Resend OTP
                  </button>
                )}
              </p>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <p className="font-body text-sm text-white/60">Create your new password.</p>
              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm text-white/70">New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-input pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm text-white/70">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="admin-input"
                  required
                />
              </div>
              {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/admin/login" className="text-white/50 hover:text-[#C0392B]">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
