"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Loader2, MapPin, Plus } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createPoliceStation,
  fetchPoliceStations,
} from "@/lib/api/police-stations"
import type { PoliceStation } from "@/lib/api/types"

const PHONE_REGEX = /^\+?[0-9]{7,15}$/

export default function PoliceStationsPage() {
  const [stations, setStations] = useState<PoliceStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contactNumber, setContactNumber] = useState("")

  const loadStations = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { stations: data, error: fetchError } = await fetchPoliceStations()
    if (fetchError) {
      setError(fetchError)
      setStations([])
    } else {
      setStations(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadStations()
  }, [loadStations])

  const resetForm = () => {
    setName("")
    setAddress("")
    setContactNumber("")
    setFormError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim() || !address.trim() || !contactNumber.trim()) {
      setFormError("All fields are required.")
      return
    }
    if (!PHONE_REGEX.test(contactNumber.trim())) {
      setFormError("Enter a valid contact number (7–15 digits, optional + prefix).")
      return
    }

    setSubmitting(true)
    const { station, error: createError } = await createPoliceStation({
      name: name.trim(),
      address: address.trim(),
      contact_number: contactNumber.trim(),
    })
    setSubmitting(false)

    if (createError || !station) {
      setFormError(createError ?? "Failed to create station")
      return
    }

    toast.success("Police station created")
    setDialogOpen(false)
    resetForm()
    void loadStations()
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] italic text-white">Police Stations</h1>
          <p className="mt-1 text-sm text-white/40">
            Manage stations for officer assignment and onboarding
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm()
            setDialogOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded border border-[#C0392B]/50 bg-[#C0392B]/10 px-4 py-2 text-xs uppercase tracking-wider text-[#FAFAFA] transition-colors hover:bg-[#C0392B]/20"
        >
          <Plus className="h-4 w-4" />
          Add station
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void loadStations()}
            className="mt-3 text-xs uppercase tracking-wider text-[#FAFAFA] underline"
          >
            Retry
          </button>
        </div>
      ) : stations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-3 text-sm text-white/50">No police stations yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Contact</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((station) => (
                <tr
                  key={station.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-white">{station.name}</td>
                  <td className="px-4 py-3 text-white/60">{station.address}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/70">
                    {station.contact_number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Create police station</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="station-name">Name</Label>
              <Input
                id="station-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={150}
                className="border-white/10 bg-black/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-address">Address</Label>
              <Input
                id="station-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={300}
                className="border-white/10 bg-black/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-contact">Contact number</Label>
              <Input
                id="station-contact"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+9779801234567"
                className="border-white/10 bg-black/40"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-400">{formError}</p>
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded border border-[#C0392B] bg-[#C0392B] px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
