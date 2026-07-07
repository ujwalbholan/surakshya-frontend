"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Inbox, Loader2, X } from "lucide-react"
import {
  acceptChildRequest,
  fetchChildPendingRequests,
  rejectChildRequest,
} from "@/lib/api/guardian"
import type { ChildPendingRequest } from "@/lib/api/types"

interface PendingGuardianRequestsProps {
  refreshKey?: number
  onChanged?: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function requestLabel(request: ChildPendingRequest) {
  if (request.direction === "GUARDIAN_TO_CHILD") {
    return "A guardian wants to link with you"
  }
  return `Request from ${request.target_name}`
}

export default function PendingGuardianRequests({
  refreshKey = 0,
  onChanged,
}: PendingGuardianRequestsProps) {
  const [requests, setRequests] = useState<ChildPendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setError(null)
    try {
      const result = await fetchChildPendingRequests()
      setRequests(result.requests)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void loadRequests()
  }, [loadRequests, refreshKey])

  const handleAccept = async (requestId: string) => {
    const previous = requests
    setRequests((current) => current.filter((r) => r.id !== requestId))
    setActingId(requestId)
    setError(null)

    try {
      await acceptChildRequest(requestId)
      onChanged?.()
    } catch (err) {
      setRequests(previous)
      setError(err instanceof Error ? err.message : "Failed to accept request")
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const previous = requests
    setRequests((current) => current.filter((r) => r.id !== requestId))
    setActingId(requestId)
    setError(null)

    try {
      await rejectChildRequest(requestId)
    } catch (err) {
      setRequests(previous)
      setError(err instanceof Error ? err.message : "Failed to reject request")
    } finally {
      setActingId(null)
    }
  }

  return (
    <section className="rounded-lg border border-[#222] bg-[#111] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Inbox className="h-4 w-4 text-[#2563eb]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#aaa]">
          Pending requests
        </h2>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#888]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests…
        </div>
      )}

      {error && (
        <p className="mb-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {!loading && requests.length === 0 && (
        <p className="text-sm text-[#666]">No pending guardian requests.</p>
      )}

      <ul className="space-y-3">
        {requests.map((request) => {
          const busy = actingId === request.id
          return (
            <li
              key={request.id}
              className="rounded border border-[#222] bg-[#0a0a0a] px-4 py-3"
            >
              <p className="text-sm font-medium">{requestLabel(request)}</p>
              {request.direction === "GUARDIAN_TO_CHILD" ? (
                <p className="mt-1 text-xs text-[#666]">
                  Accept to allow this guardian to monitor your SOS alerts.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#666]">{request.target_email}</p>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-wider text-[#555]">
                {formatDate(request.created_at)}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleAccept(request.id)}
                  className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleReject(request.id)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#444] bg-transparent px-3 py-1.5 text-xs font-medium text-[#888] transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                  Reject
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
