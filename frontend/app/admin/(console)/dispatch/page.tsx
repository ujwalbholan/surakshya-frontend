"use client"

import { useCallback, useEffect, useState } from "react"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminDispatch, type AdminDispatchEvent } from "@/lib/api/admin-dispatch"
import { clearAdminSession } from "@/lib/auth/admin-session"
import { Send } from "lucide-react"

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return iso
  }
}

export default function DispatchPage() {
  const [events, setEvents] = useState<AdminDispatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDispatch = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetchAdminDispatch({ limit: 50 }).then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        return
      }
      if (error || !data) {
        setLoadError(error ?? "Failed to load dispatch log")
        setLoading(false)
        return
      }
      setEvents(data.events)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadDispatch()
  }, [loadDispatch])

  return (
    <PageTransition>
      <div className="mb-6 flex items-center gap-3">
        <Send className="h-5 w-5 text-[#C0392B]" />
        <h1 className="font-display text-[28px] italic text-white">Dispatch Log</h1>
      </div>
      <div className="admin-card">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-white/5" />
            ))}
          </div>
        ) : loadError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-400">{loadError}</p>
            <button onClick={loadDispatch} className="admin-btn-ghost mt-4">
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/50">
            No dispatch events yet. Assign a unit to a case or set unit status to dispatched.
          </p>
        ) : (
          <div className="space-y-0 border-l border-white/10 pl-4">
            {events.map((entry) => (
              <div key={entry.id} className="relative pb-6">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#C0392B]" />
                <p className="font-mono-admin text-[10px] text-white/40">
                  {formatTime(entry.time)}
                </p>
                <p className="text-sm text-white">
                  <span className="font-medium">{entry.unit}</span> — {entry.action}
                </p>
                <p className="text-xs text-white/50">
                  {entry.officer} · {entry.case}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
