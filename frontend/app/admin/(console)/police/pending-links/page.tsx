"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MapPin,
  ShieldAlert,
  X,
} from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  approveStationLink,
  fetchPendingStationLinks,
  rejectStationLink,
} from "@/lib/api/police-pending-links"
import type { PendingStationLink } from "@/lib/api/types"
import { getAdminSession } from "@/lib/auth/admin-session"

const PAGE_SIZE = 20
const REJECT_REASON_MAX = 500

function formatRequestedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function PendingStationLinksPage() {
  const router = useRouter()
  const [roleChecked, setRoleChecked] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [links, setLinks] = useState<PendingStationLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingStationLink | null>(
    null
  )
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    const session = getAdminSession()
    const allowed = session?.role === "SUPER_ADMIN"
    setIsSuperAdmin(allowed)
    setRoleChecked(true)
    if (!allowed) {
      setLoading(false)
    }
  }, [])

  const loadLinks = useCallback(async (nextPage: number) => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError, status } = await fetchPendingStationLinks({
      page: nextPage,
      limit: PAGE_SIZE,
    })

    if (status === 401) {
      setError("Your session has expired. Please sign in again.")
      setLinks([])
      setLoading(false)
      return
    }

    if (status === 403) {
      setError("Only Super Admins can review station assignments.")
      setLinks([])
      setIsSuperAdmin(false)
      setLoading(false)
      return
    }

    if (fetchError || !data) {
      setError(fetchError ?? "Failed to load pending station links")
      setLinks([])
      setLoading(false)
      return
    }

    setLinks(data.links)
    setTotal(data.total)
    setPage(data.page)
    setTotalPages(Math.max(1, data.totalPages))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!roleChecked || !isSuperAdmin) return
    void loadLinks(page)
  }, [roleChecked, isSuperAdmin, page, loadLinks])

  const handleApprove = async (link: PendingStationLink) => {
    const previous = links
    setLinks((current) => current.filter((item) => item.id !== link.id))
    setActingId(link.id)
    setError(null)

    const { error: approveError, status } = await approveStationLink(link.id)
    setActingId(null)

    if (approveError) {
      setLinks(previous)
      if (status === 403) {
        toast.error("Only Super Admins can approve station assignments.")
      } else {
        toast.error(approveError)
      }
      return
    }

    setTotal((count) => Math.max(0, count - 1))
    toast.success(
      `${link.officer.full_name} approved for ${link.station.name}`
    )

    if (previous.length === 1 && page > 1) {
      setPage((current) => current - 1)
    } else if (previous.length === 1) {
      void loadLinks(page)
    }
  }

  const openRejectDialog = (link: PendingStationLink) => {
    setRejectTarget(link)
    setRejectReason("")
    setRejectError(null)
  }

  const closeRejectDialog = () => {
    if (rejecting) return
    setRejectTarget(null)
    setRejectReason("")
    setRejectError(null)
  }

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return

    const reason = rejectReason.trim()
    if (!reason) {
      setRejectError("A rejection reason is required.")
      return
    }
    if (reason.length > REJECT_REASON_MAX) {
      setRejectError(`Reason must be ${REJECT_REASON_MAX} characters or fewer.`)
      return
    }

    setRejecting(true)
    setRejectError(null)

    const { error: rejectApiError, status } = await rejectStationLink(
      rejectTarget.id,
      reason
    )
    setRejecting(false)

    if (rejectApiError) {
      if (status === 403) {
        setRejectError("Only Super Admins can reject station assignments.")
      } else {
        setRejectError(rejectApiError)
      }
      return
    }

    const rejectedId = rejectTarget.id
    const officerName = rejectTarget.officer.full_name
    const wasLastOnPage = links.length === 1

    setRejectTarget(null)
    setRejectReason("")
    setLinks((current) => current.filter((item) => item.id !== rejectedId))
    setTotal((count) => Math.max(0, count - 1))
    toast.success(`Station assignment for ${officerName} rejected`)

    if (wasLastOnPage && page > 1) {
      setPage((current) => current - 1)
    } else if (wasLastOnPage) {
      void loadLinks(page)
    }
  }

  if (!roleChecked) {
    return (
      <PageTransition>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-white/5" />
          ))}
        </div>
      </PageTransition>
    )
  }

  if (!isSuperAdmin) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/10 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-300" />
          <h1 className="mt-4 font-display text-2xl italic text-white">
            Super Admin only
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Station assignment approvals require a Super Admin account. Ask a
            Super Admin to review pending officer–station links.
          </p>
          <button
            type="button"
            onClick={() => router.push("/admin/dashboard")}
            className="mt-6 text-xs uppercase tracking-wider text-[#C0392B] underline"
          >
            Back to dashboard
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] italic text-white">
            Pending Station Links
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Approve or reject officer station assignments before they can log in
          </p>
        </div>
        {!loading && !error && (
          <div className="rounded border border-white/10 px-3 py-1.5 font-mono-admin text-[11px] uppercase tracking-wider text-white/50">
            {total} pending
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void loadLinks(page)}
            className="mt-3 text-xs uppercase tracking-wider text-[#FAFAFA] underline"
          >
            Retry
          </button>
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-3 text-sm text-white/50">
            No pending station assignments.
          </p>
          <p className="mt-1 text-xs text-white/30">
            New requests appear here after an admin invites an officer.
          </p>
          <Link
            href="/admin/police/invite"
            className="mt-5 inline-block text-xs uppercase tracking-wider text-[#C0392B] underline"
          >
            Invite an officer
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {links.map((link) => {
              const busy = actingId === link.id
              return (
                <li
                  key={link.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <p className="text-base font-medium text-white">
                          {link.officer.full_name}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-white/50">
                          {link.officer.email}
                          <span className="text-white/20"> · </span>
                          <span className="font-mono-admin text-xs">
                            {link.officer.phone}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex min-w-0 items-start gap-2">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C0392B]/80" />
                          <div className="min-w-0">
                            <p className="font-mono-admin text-[10px] uppercase tracking-wider text-white/35">
                              Station
                            </p>
                            <p className="text-white/80">{link.station.name}</p>
                            <p className="truncate text-xs text-white/40">
                              {link.station.address}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-mono-admin text-[10px] uppercase tracking-wider text-white/35">
                            Requested by
                          </p>
                          <p className="text-white/80">
                            {link.requested_by.full_name}
                          </p>
                          <p className="truncate text-xs text-white/40">
                            {link.requested_by.email}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono-admin text-[10px] uppercase tracking-wider text-white/35">
                            Requested
                          </p>
                          <p className="font-mono-admin text-xs text-white/60">
                            {formatRequestedAt(link.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={busy || rejecting}
                        onClick={() => void handleApprove(link)}
                        className="inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-medium uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy || rejecting}
                        onClick={() => openRejectDialog(link)}
                        className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-transparent px-3 py-2 text-xs font-medium uppercase tracking-wider text-white/55 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <p className="font-mono-admin text-[11px] text-white/40">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-white/60 transition-colors hover:bg-white/5 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="inline-flex items-center gap-1 rounded border border-white/10 px-3 py-1.5 text-xs uppercase tracking-wider text-white/60 transition-colors hover:bg-white/5 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={rejectTarget != null}
        onOpenChange={(open) => {
          if (!open) closeRejectDialog()
        }}
      >
        <DialogContent className="border-white/10 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Reject station assignment</DialogTitle>
          </DialogHeader>
          {rejectTarget && (
            <div className="space-y-4">
              <p className="text-sm text-white/55">
                Rejecting will suspend{" "}
                <span className="text-white">
                  {rejectTarget.officer.full_name}
                </span>
                ’s assignment to{" "}
                <span className="text-white">{rejectTarget.station.name}</span>
                . Provide a reason for the requesting admin.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Reason</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={REJECT_REASON_MAX}
                  rows={4}
                  placeholder="e.g. Officer assigned to the wrong district station."
                  className="border-white/10 bg-black/40"
                />
                <p className="text-right font-mono-admin text-[10px] text-white/30">
                  {rejectReason.length}/{REJECT_REASON_MAX}
                </p>
              </div>
              {rejectError && (
                <p className="text-sm text-red-400" role="alert">
                  {rejectError}
                </p>
              )}
              <DialogFooter>
                <button
                  type="button"
                  disabled={rejecting}
                  onClick={closeRejectDialog}
                  className="rounded border border-white/10 px-4 py-2 text-xs uppercase tracking-wider text-white/60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rejecting || !rejectReason.trim()}
                  onClick={() => void handleRejectConfirm()}
                  className="inline-flex items-center gap-2 rounded border border-red-500/50 bg-red-500/15 px-4 py-2 text-xs uppercase tracking-wider text-red-300 disabled:opacity-60"
                >
                  {rejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm reject
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
