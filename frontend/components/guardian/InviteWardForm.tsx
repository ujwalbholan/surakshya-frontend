"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteWard } from "@/lib/api/guardian"

interface InviteWardFormProps {
  onSuccess?: () => void
}

export default function InviteWardForm({ onSuccess }: InviteWardFormProps) {
  const [childEmail, setChildEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedEmail = childEmail.trim()
    if (!trimmedEmail) {
      setError("Child email is required.")
      return
    }

    setSubmitting(true)
    try {
      const result = await inviteWard({ child_email: trimmedEmail })
      setSuccess(
        result.message ||
          "Invitation sent. The child must accept the request before you can monitor their SOS alerts."
      )
      setChildEmail("")
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send invitation"
      if (message.includes("No user found with this email")) {
        setError(
          "No Surakshya account exists for that email. The child must sign up first."
        )
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-[#222] bg-[#111] p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-[#2563eb]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#aaa]">
          Invite a ward
        </h2>
      </div>
      <p className="mb-4 text-xs text-[#666]">
        Enter the email of a registered Surakshya user. They will receive a link
        request and must accept before you can view their SOS alerts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="child-email" className="text-[#aaa]">
            Child email
          </Label>
          <Input
            id="child-email"
            type="email"
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            placeholder="child@example.com"
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
