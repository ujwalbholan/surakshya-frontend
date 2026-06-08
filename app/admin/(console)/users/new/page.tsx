"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { registerAdminUser } from "@/lib/api/admin-auth"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ROLES = ["SUPER_ADMIN", "ADMIN", "POLICE", "GUARDIAN", "USER"] as const

interface FieldErrors {
  full_name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (phone.startsWith("+977")) return digits.length >= 12
  return digits.length === 10 && digits.startsWith("9")
}

export default function NewUserPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<string>("USER")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const validate = (): boolean => {
    const e: FieldErrors = {}
    if (!fullName.trim()) e.full_name = "Full name is required"
    if (!email.trim()) e.email = "Email is required"
    else if (!validateEmail(email)) e.email = "Invalid email format"
    if (!phone.trim()) e.phone = "Phone is required"
    else if (!validatePhone(phone)) e.phone = "Use +977 format or 10-digit Nepali number"
    if (!password) e.password = "Password is required"
    else if (password.length < 8) e.password = "Minimum 8 characters"
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleBlur = (field: keyof FieldErrors) => {
    validate()
    void field
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const { error, status } = await registerAdminUser({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role,
    })

    if (status === 400 && error?.toLowerCase().includes("email")) {
      setErrors({ email: "This email is already registered" })
      setSubmitting(false)
      return
    }
    if (status === 400 && error?.toLowerCase().includes("phone")) {
      setErrors({ phone: "This phone number is already registered" })
      setSubmitting(false)
      return
    }
    if (error) {
      toast.error(error)
      setSubmitting(false)
      return
    }

    toast.success("User registered successfully")
    router.push("/admin/users")
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-display text-[28px] italic text-white">Register New User</h1>
        <div className="admin-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Full Name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => handleBlur("full_name")} className="admin-input" />
              {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur("email")} className="admin-input" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Phone *</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => handleBlur("phone")} placeholder="+977-980-123-4567" className="admin-input" />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Password *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur("password")} className="admin-input pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Confirm Password *</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => handleBlur("confirmPassword")} className="admin-input" />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-white/70">Role *</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0A0A0A]">
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="admin-btn-primary flex-1">
                {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Register User"}
              </button>
              <Link href="/admin/users" className="admin-btn-ghost flex items-center justify-center px-6">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </PageTransition>
  )
}
