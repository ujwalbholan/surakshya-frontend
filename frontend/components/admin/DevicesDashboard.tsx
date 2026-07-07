"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  Link2,
  Link2Off,
  Plus,
  Radio,
  Search,
  UserCheck,
  Watch,
  Wifi,
  WifiOff,
} from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { fetchUsers, type AdminUserRecord } from "@/lib/api/admin-auth"
import {
  assignDevice as assignDeviceApi,
  createAdminDevice,
  fetchAdminDevices,
  unassignDevice,
  type AdminDeviceRecord,
} from "@/lib/api/admin-devices"
import { clearAdminSession } from "@/lib/auth/admin-session"

const PAGE_SIZE = 10

function formatLastSeen(iso: string | null): string {
  if (!iso) return "Never"
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  return date.toLocaleDateString()
}

export default function DevicesDashboard() {
  const [devices, setDevices] = useState<AdminDeviceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerImei, setRegisterImei] = useState("wearable-001")
  const [registerLabel, setRegisterLabel] = useState("")
  const [registering, setRegistering] = useState(false)

  const [assignTarget, setAssignTarget] = useState<AdminDeviceRecord | null>(null)
  const [userSearch, setUserSearch] = useState("")
  const [userResults, setUserResults] = useState<AdminUserRecord[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  const [unassignTarget, setUnassignTarget] = useState<AdminDeviceRecord | null>(null)
  const [unassigning, setUnassigning] = useState(false)

  const loadDevices = useCallback(async () => {
    setLoading(true)
    const { data, error, status } = await fetchAdminDevices({ limit: 200 })
    if (status === 401) {
      clearAdminSession()
      setLoadError("Your session expired. Please log in again.")
      setDevices([])
    } else if (error) {
      setLoadError(error)
      setDevices([])
    } else if (data?.data) {
      setDevices(data.data)
      setLoadError(null)
    } else {
      setDevices([])
      setLoadError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDevices()
  }, [loadDevices])

  useEffect(() => {
    if (!assignTarget) return
    const timer = setTimeout(async () => {
      setUsersLoading(true)
      const { data } = await fetchUsers({
        role: "USER",
        search: userSearch.trim() || undefined,
        limit: 20,
      })
      setUserResults(data?.data ?? [])
      setUsersLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [assignTarget, userSearch])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return devices
    return devices.filter(
      (d) =>
        d.imei.toLowerCase().includes(q) ||
        (d.label?.toLowerCase().includes(q) ?? false) ||
        d.user?.full_name.toLowerCase().includes(q) ||
        d.user?.email.toLowerCase().includes(q)
    )
  }, [devices, search])

  const summary = useMemo(
    () => ({
      total: devices.length,
      assigned: devices.filter((d) => d.user).length,
      unassigned: devices.filter((d) => !d.user).length,
      online: devices.filter((d) => d.isOnline).length,
    }),
    [devices]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  const handleRegister = async () => {
    const imei = registerImei.trim()
    if (!imei) {
      toast.error("Band ID is required")
      return
    }
    setRegistering(true)
    const { data, error } = await createAdminDevice({
      imei,
      label: registerLabel.trim() || undefined,
    })
    setRegistering(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(`Band ${imei} registered`)
    setRegisterOpen(false)
    setRegisterLabel("")
    if (data) {
      setDevices((prev) => [data, ...prev.filter((d) => d.id !== data.id)])
    } else {
      void loadDevices()
    }
  }

  const openAssign = (device: AdminDeviceRecord) => {
    setAssignTarget(device)
    setUserSearch("")
    setSelectedUserId(device.user?.id ?? null)
    setUserResults([])
  }

  const handleAssign = async () => {
    if (!assignTarget || !selectedUserId) {
      toast.error("Select a citizen to assign")
      return
    }
    if (
      assignTarget.user &&
      assignTarget.user.id !== selectedUserId &&
      !window.confirm(
        `This band is assigned to ${assignTarget.user.full_name}. Replace with the selected user?`
      )
    ) {
      return
    }
    setAssigning(true)
    const { data, error } = await assignDeviceApi(assignTarget.id, selectedUserId)
    setAssigning(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Band assigned")
    setAssignTarget(null)
    if (data) {
      setDevices((prev) => prev.map((d) => (d.id === data.id ? data : d)))
    } else {
      void loadDevices()
    }
  }

  const handleUnassign = async () => {
    if (!unassignTarget) return
    setUnassigning(true)
    const { data, error } = await unassignDevice(unassignTarget.id)
    setUnassigning(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Band unassigned")
    setUnassignTarget(null)
    if (data) {
      setDevices((prev) => prev.map((d) => (d.id === data.id ? data : d)))
    } else {
      void loadDevices()
    }
  }

  return (
    <TooltipProvider>
      <PageTransition>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[28px] italic text-white">Devices</h1>
            <p className="mt-1 text-sm text-white/40">
              Register Suraksha bands and link them to citizen accounts. Band ID matches firmware{" "}
              <code className="text-white/60">DEVICE_ID</code> (e.g. wearable-001).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search band ID, label, owner..."
                className="admin-input w-64 pl-9 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setRegisterOpen(true)}
              className="admin-btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Register Band
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Bands" value={summary.total} icon={Watch} animate={false} />
          <StatCard label="Assigned" value={summary.assigned} icon={UserCheck} animate={false} />
          <StatCard label="Unassigned" value={summary.unassigned} icon={Link2Off} animate={false} />
          <StatCard label="Online" value={summary.online} icon={Radio} animate={false} />
        </div>

        <div className="admin-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                  {["Band ID", "Label", "Owner", "Online", "Last seen", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <Skeleton className="h-4 w-full bg-white/5" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Watch className="mx-auto h-8 w-8 text-white/10" />
                      <p className="mt-3 font-display text-lg italic text-white/35">
                        {loadError ?? "No bands registered yet"}
                      </p>
                      {loadError ? (
                        <Link
                          href="/admin/login"
                          className="mt-2 inline-block text-sm text-white/50 hover:text-white"
                        >
                          Log in again →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRegisterOpen(true)}
                          className="mt-2 inline-block text-sm text-white/50 hover:text-white"
                        >
                          Register a band →
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((device) => (
                    <tr
                      key={device.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5 font-mono-admin text-xs text-white">
                        {device.imei}
                      </td>
                      <td className="px-5 py-3.5 text-white/65">{device.label ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {device.user ? (
                          <div>
                            <p className="font-medium text-white">{device.user.full_name}</p>
                            <p className="text-xs text-white/45">{device.user.email}</p>
                          </div>
                        ) : (
                          <span className="rounded border border-white/10 px-2 py-0.5 text-[10px] tracking-wide text-white/40 uppercase">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs",
                            device.isOnline ? "text-emerald-400" : "text-white/35"
                          )}
                        >
                          {device.isOnline ? (
                            <Wifi className="h-3.5 w-3.5" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5" />
                          )}
                          {device.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/45">
                        {formatLastSeen(device.lastSeenAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => openAssign(device)}
                                className="rounded-md p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white"
                              >
                                <Link2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {device.user ? "Reassign band" : "Assign to citizen"}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                disabled={!device.user}
                                onClick={() => setUnassignTarget(device)}
                                className="rounded-md p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                              >
                                <Link2Off className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Unassign band</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <p className="text-xs text-white/45">
              Showing {rangeStart}–{rangeEnd} of {filtered.length} bands
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono-admin text-[10px] text-white/30">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
          <DialogContent className="border-white/10 bg-[#0A0A0A] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Register Band</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Band ID</Label>
                <Input
                  value={registerImei}
                  onChange={(e) => setRegisterImei(e.target.value)}
                  placeholder="wearable-001"
                  className="admin-input mt-1 font-mono-admin"
                />
                <p className="mt-1 text-xs text-white/40">
                  Must match <code>DEVICE_ID</code> in firmware.
                </p>
              </div>
              <div>
                <Label>Label (optional)</Label>
                <Input
                  value={registerLabel}
                  onChange={(e) => setRegisterLabel(e.target.value)}
                  placeholder="Bikram Band"
                  className="admin-input mt-1"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <button type="button" onClick={() => setRegisterOpen(false)} className="admin-btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={registering}
                className="admin-btn-primary"
              >
                {registering ? "Registering…" : "Register"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!assignTarget} onOpenChange={() => setAssignTarget(null)}>
          <DialogContent className="border-white/10 bg-[#0A0A0A] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Band</DialogTitle>
            </DialogHeader>
            {assignTarget && (
              <div className="space-y-3">
                <p className="text-sm text-white/50">
                  Link <span className="font-mono-admin text-white">{assignTarget.imei}</span> to a
                  citizen (USER role).
                </p>
                <div>
                  <Label>Search citizens</Label>
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Name, email, or phone"
                    className="admin-input mt-1"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                  {usersLoading ? (
                    <p className="p-4 text-sm text-white/40">Loading…</p>
                  ) : userResults.length === 0 ? (
                    <p className="p-4 text-sm text-white/40">No citizens found</p>
                  ) : (
                    userResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={cn(
                          "flex w-full flex-col items-start border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/5",
                          selectedUserId === user.id && "bg-white/[0.06]"
                        )}
                      >
                        <span className="font-medium text-white">{user.full_name}</span>
                        <span className="text-xs text-white/45">
                          {user.email} · {user.phone}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <button type="button" onClick={() => setAssignTarget(null)} className="admin-btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning || !selectedUserId}
                className="admin-btn-primary"
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!unassignTarget} onOpenChange={() => setUnassignTarget(null)}>
          <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Unassign Band</AlertDialogTitle>
              <AlertDialogDescription className="text-white/55">
                Remove {unassignTarget?.user?.full_name ?? "the owner"} from band{" "}
                {unassignTarget?.imei}? SOS alerts will no longer show victim details until
                reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnassign}
                disabled={unassigning}
                className="bg-[#C0392B] text-white hover:bg-[#E74C3C]"
              >
                {unassigning ? "Unassigning…" : "Unassign"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </TooltipProvider>
  )
}
