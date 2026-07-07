"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import GuardianAuthGuard from "@/components/auth/GuardianAuthGuard"
import { fetchWardSos } from "@/lib/api/guardian"
import type { GuardianWardSosEvent } from "@/lib/api/types"

function WardSosView() {
  const params = useParams<{ wardId: string }>()
  const wardId = params.wardId
  const [events, setEvents] = useState<GuardianWardSosEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEvents = useCallback(async () => {
    if (!wardId) return
    setError(null)
    try {
      const result = await fetchWardSos(wardId)
      setEvents(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SOS events")
    } finally {
      setLoading(false)
    }
  }, [wardId])

  useEffect(() => {
    void loadEvents()
    const interval = setInterval(() => void loadEvents(), 30000)
    return () => clearInterval(interval)
  }, [loadEvents])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/guardian"
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#888] hover:text-[#fafafa]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to wards
      </Link>

      <h1 className="text-lg font-semibold">Ward SOS alerts</h1>
      <p className="mt-1 font-mono text-[10px] text-[#666]">Ward {wardId}</p>

      {loading && (
        <div className="mt-8 flex items-center gap-2 text-[#888]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="mt-8 text-sm text-[#888]">No active SOS events.</p>
      )}

      <ul className="mt-6 space-y-3">
        {events.map((event) => (
          <li
            key={event.id}
            className="rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#E74C3C]">
                  Active SOS · {event.imei}
                </p>
                {event.label && (
                  <p className="text-xs text-[#aaa]">{event.label}</p>
                )}
              </div>
              <span className="font-mono text-[9px] uppercase text-[#888]">
                {new Date(event.startedAt).toLocaleString()}
              </span>
            </div>
            {event.triggerNotes && (
              <p className="mt-2 text-sm text-[#ccc]">{event.triggerNotes}</p>
            )}
            {(event.lastLocation ?? (event.latitude != null && event.longitude != null)) && (
              <p className="mt-2 font-mono text-[10px] text-[#888]">
                {event.lastLocation
                  ? `${event.lastLocation.latitude.toFixed(4)}, ${event.lastLocation.longitude.toFixed(4)}`
                  : `${event.latitude!.toFixed(4)}, ${event.longitude!.toFixed(4)}`}
              </p>
            )}
            {event.assignedStationName && (
              <p className="mt-1 text-[10px] text-[#666]">
                Station: {event.assignedStationName}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function WardSosPage() {
  return (
    <GuardianAuthGuard>
      <WardSosView />
    </GuardianAuthGuard>
  )
}
