"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteGuardian } from "@/lib/api/guardian"

const NEPAL_PHONE_REGEX = /^(\+977)?9[678]\d{8}$/

interface InviteGuardianFormProps {
  onSuccess?: () => void
}

export default function InviteGuardianForm({ onSuccess }: InviteGuardianFormProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetForm = () => {
    setFullName("")
    setEmail("")
    setPhone("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setError("All fields are required.")
      return
    }
    if (trimmedName.length < 4 || trimmedName.length > 15) {
      setError("Name must be between 4 and 15 characters.")
      return
    }
    if (!NEPAL_PHONE_REGEX.test(trimmedPhone)) {
      setError("Enter a valid Nepal mobile number (e.g. 98XXXXXXXX).")
      return
    }

    setSubmitting(true)
    try {
      const result = await inviteGuardian({
        full_name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      })
      setSuccess(
        result.message ||
          "Invitation sent. Your guardian will receive login credentials by email and an SMS OTP to complete setup."
      )
      resetForm()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-[#222] bg-[#111] p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-[#2563eb]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#aaa]">
          Invite a guardian
        </h2>
      </div>
      <p className="mb-4 text-xs text-[#666]">
        We create a guardian account and email temporary login credentials.
        They must verify their phone and set a new password before accepting.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guardian-name" className="text-[#aaa]">
            Full name
          </Label>
          <Input
            id="guardian-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            disabled={submitting}
            className="border-[#333] bg-[#0a0a0a] text-[#fafafa]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian-email" className="text-[#aaa]">
            Email
          </Label>
          <Input
            id="guardian-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guardian@example.com"
            disabled={submitting}
            className="border-[#333] bg-[#0a0a0a] text-[#fafafa]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guardian-phone" className="text-[#aaa]">
            Phone
          </Label>
          <Input
            id="guardian-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            disabled={submitting}
            className="border-[#333] bg-[#0a0a0a] text-[#fafafa]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-emerald-300" role="status">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded border border-[#2563eb]/50 bg-[#2563eb]/10 px-4 py-2.5 text-sm font-medium text-[#fafafa] transition-colors hover:bg-[#2563eb]/20 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send invitation"
          )}
        </button>
      </form>
    </section>
  )
}
