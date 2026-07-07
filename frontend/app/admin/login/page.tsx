"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import gsap from "gsap"
import toast, { Toaster } from "react-hot-toast"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import SurakshaShieldLogo from "@/components/admin/SurakshaShieldLogo"
import { adminLogin } from "@/lib/api/admin-auth"
import { setAdminSession } from "@/lib/auth/admin-session"

export default function AdminLoginPage() {
  const router = useRouter()
  const pageRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const retryRef = useRef(false)

  useEffect(() => {
    const page = pageRef.current
    const form = formRef.current
    if (!page) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } })

      const logo = page.querySelector(".login-logo")
      const tagline = page.querySelector(".login-tagline")
      const subtitle = page.querySelector(".login-subtitle")

      if (logo) tl.from(logo, { opacity: 0, y: 30, duration: 0.6 })
      if (tagline) tl.from(tagline, { opacity: 0, y: 30, duration: 0.6 }, logo ? "-=0.52" : 0)
      if (subtitle) tl.from(subtitle, { opacity: 0, y: 30, duration: 0.6 }, "-=0.52")

      const fields = form?.querySelectorAll(".login-field")
      if (fields?.length) {
        gsap.from(fields, {
          opacity: 0,
          x: 40,
          duration: 0.3,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.2,
        })
      }
    }, page)

    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e?: React.FormEvent, isRetry = false) => {
    e?.preventDefault()
    if (submitting && !isRetry) return

    setEmailError(null)
    setPasswordError(null)
    setSubmitting(true)

    const { data, error, status } = await adminLogin(email.trim(), password)

    if (status === 0) {
      if (!isRetry && !retryRef.current) {
        retryRef.current = true
        toast.error("Connection error — server may be starting up (Render cold start). Retrying…")
        setTimeout(() => {
          void handleSubmit(undefined, true)
        }, 4000)
        return
      }
      toast.error("Connection error. Please try again.")
      setSubmitting(false)
      retryRef.current = false
      return
    }

    retryRef.current = false

    if (status === 401) {
      if (error === "Invalid Email" || error?.toLowerCase().includes("email")) {
        setEmailError("No account found with this email")
      } else if (error === "Invalid Password" || error?.toLowerCase().includes("password")) {
        setPasswordError("Incorrect password")
      } else {
        toast.error(error || "Invalid credentials")
      }
      setSubmitting(false)
      return
    }

    if (error || !data) {
      toast.error(error || "Login failed")
      setSubmitting(false)
      return
    }

    const user = data.user
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      toast.error("Access denied. Admin credentials required.")
      setSubmitting(false)
      return
    }

    setAdminSession({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    })

    if (rememberMe) {
      localStorage.setItem("suraksha_admin_remember", email.trim())
    }

    router.push("/admin/dashboard")
  }

  return (
    <div ref={pageRef} className="flex min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#0A0A0A", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" },
        }}
      />

      {/* Left panel */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-black lg:flex"
      >
        <div className="admin-grain-overlay" />
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <div className="login-logo mb-8">
            <SurakshaShieldLogo size={80} />
          </div>
          <p
            className="login-tagline font-display text-[48px] italic leading-tight text-white"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            The Guardian On Your Wrist
          </p>
          <p className="login-subtitle mt-4 font-body text-sm tracking-widest text-white/40 uppercase">
            Super Admin Command Centre · Nepal
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex w-full flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12 lg:w-1/2">
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-[#C0392B]" />

        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <SurakshaShieldLogo size={56} />
            <p className="mt-4 font-display text-2xl italic text-white">The Guardian On Your Wrist</p>
          </div>

          <h1 className="mb-2 font-body text-xl font-semibold text-white">Sign In</h1>
          <p className="mb-8 font-body text-sm text-white/50">Access the Suraksha Super Admin console</p>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div className="login-field">
              <label htmlFor="email" className="mb-1.5 block font-body text-sm text-white/70">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                className="admin-input"
                placeholder="admin@suraksha.com.np"
                autoComplete="email"
                required
              />
              {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
            </div>

            <div className="login-field">
              <label htmlFor="password" className="mb-1.5 block font-body text-sm text-white/70">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                  className="admin-input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
            </div>

            <div className="login-field flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#0A0A0A] accent-[#C0392B]"
              />
              <label htmlFor="remember" className="font-body text-sm text-white/60">
                Remember me
              </label>
            </div>

            <div className="login-field">
              <button
                type="submit"
                disabled={submitting}
                className="admin-btn-primary w-full py-3 text-sm tracking-[0.12em] uppercase disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                ) : (
                  "Sign In to Command Centre"
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center font-body text-sm">
            <Link href="/admin/forgot-password" className="text-white/50 transition hover:text-[#C0392B]">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
