"use client"

import { useEffect, useState } from "react"
import { Loader2, Send } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { invitePoliceOfficer } from "@/lib/api/police-invites"
import { fetchPoliceStations } from "@/lib/api/police-stations"
import type { PoliceStation } from "@/lib/api/types"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[0-9]{7,15}$/

export default function InviteOfficerPage() {
  const [stations, setStations] = useState<PoliceStation[]>([])
  const [stationsLoading, setStationsLoading] = useState(true)
  const [stationsError, setStationsError] = useState<string | null>(null)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [stationId, setStationId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  useEffect(() => {
    fetchPoliceStations().then(({ stations: data, error: fetchError }) => {
      if (fetchError) {
        setStationsError(fetchError)
      } else {
        setStations(data)
      }
      setStationsLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !phone.trim() || !stationId) {
      setError("All fields are required.")
      return
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Enter a valid email address.")
      return
    }
    if (!PHONE_REGEX.test(phone.trim())) {
      setError("Enter a valid phone number (7–15 digits, optional + prefix).")
      return
    }

    setSubmitting(true)
    const { data, error: inviteError, status } = await invitePoliceOfficer({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      station_id: stationId,
    })
    setSubmitting(false)

    if (inviteError || !data) {
      setError(
        status === 401
          ? "Session expired. Please sign out and log in again."
          : status === 409
          ? inviteError ?? "An active invite or user already exists for this email."
          : inviteError ?? "Failed to send invite."
      )
      return
    }

    setSuccessEmail(data.email)
    setFullName("")
    setEmail("")
    setPhone("")
    setStationId("")
  }

  if (successEmail) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <Send className="mx-auto h-10 w-10 text-emerald-400" />
          <h1 className="mt-4 font-display text-2xl italic text-white">
            Invite sent
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Invite sent to <span className="text-white">{successEmail}</span>.
            The officer will receive setup instructions by email.
          </p>
          <button
            type="button"
            onClick={() => setSuccessEmail(null)}
            className="mt-6 text-xs uppercase tracking-wider text-[#C0392B] underline"
          >
            Invite another officer
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="font-display text-[28px] italic text-white">Invite Officer</h1>
        <p className="mt-1 text-sm text-white/40">
          Send a secure onboarding invite to a new police officer
        </p>
      </div>

      {stationsLoading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stations…
        </div>
      ) : stationsError ? (
        <p className="text-sm text-red-400">{stationsError}</p>
      ) : stations.length === 0 ? (
        <p className="text-sm text-amber-400">
          Create at least one police station before inviting officers.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-lg space-y-5 rounded-lg border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={150}
              className="border-white/10 bg-black/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-black/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+9779801234567"
              className="border-white/10 bg-black/40"
            />
          </div>
          <div className="space-y-2">
            <Label>Station</Label>
            <Select value={stationId} onValueChange={setStationId}>
              <SelectTrigger className="border-white/10 bg-black/40">
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-[#C0392B] bg-[#C0392B] py-3 text-xs uppercase tracking-wider text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send invite
          </button>
        </form>
      )}
    </PageTransition>
  )
}
