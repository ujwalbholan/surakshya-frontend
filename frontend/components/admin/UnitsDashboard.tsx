"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Car,
  CheckCircle2,
  MapPin,
  Navigation,
  Radio,
  Search,
  Siren,
  WifiOff,
} from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { UnitStatusBadge } from "@/components/admin/Badges"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import { fetchAdminCases, updateAdminCase } from "@/lib/api/admin-cases"
import { fetchAdminUnits, updateAdminUnit } from "@/lib/api/admin-units"
import { clearAdminSession } from "@/lib/auth/admin-session"
import { mapApiCasesToMockCases } from "@/lib/admin/case-mappers"
import { mapApiUnitsToMockUnits } from "@/lib/admin/unit-mappers"
import { NEPAL_PROVINCES } from "@/lib/admin/constants"
import type { MockCase, MockUnit, UnitStatus } from "@/lib/admin/domain-types"

const STATUS_FILTERS: { value: UnitStatus | "all"; label: string }[] = [
  { value: "all", label: "All Units" },
  { value: "available", label: "Available" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on_scene", label: "On Scene" },
  { value: "offline", label: "Offline" },
]

const SUMMARY_CARDS: {
  status: UnitStatus
  label: string
  icon: typeof CheckCircle2
}[] = [
  { status: "available", label: "Available", icon: CheckCircle2 },
  { status: "dispatched", label: "Dispatched", icon: Navigation },
  { status: "on_scene", label: "On Scene", icon: Siren },
  { status: "offline", label: "Offline", icon: WifiOff },
]

function getCaseHref(caseId: string) {
  return caseId.startsWith("SOS-") ? `/admin/sos/${caseId}` : `/admin/cases/${caseId}`
}

function parseOfficer(officer: string) {
  const parts = officer.split(" ")
  const rank = parts[0]?.length <= 4 ? parts[0] : null
  const name = rank ? parts.slice(1).join(" ") : officer
  return { rank, name }
}

export default function UnitsDashboard() {
  const [units, setUnits] = useState<MockUnit[]>([])
  const [openCases, setOpenCases] = useState<MockCase[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "all">("all")
  const [provinceFilter, setProvinceFilter] = useState("All")
  const [dispatchUnit, setDispatchUnit] = useState<MockUnit | null>(null)
  const [selectedCase, setSelectedCase] = useState("")

  const loadData = useCallback(() => {
    setLoading(true)
    setLoadError(null)

    Promise.all([
      fetchAdminUnits({ limit: 100 }),
      fetchAdminCases({ limit: 100 }),
    ]).then(([unitsRes, casesRes]) => {
      if (unitsRes.status === 401 || casesRes.status === 401) {
        clearAdminSession()
        return
      }
      if (unitsRes.error || !unitsRes.data) {
        setLoadError(unitsRes.error ?? "Failed to load units")
        setLoading(false)
        return
      }

      const cases = mapApiCasesToMockCases(casesRes.data?.cases ?? [])
      const caseNumberByUnitId = new Map<string, string>()
      for (const c of casesRes.data?.cases ?? []) {
        if (c.assigned_unit_id && c.status !== "CLOSED") {
          caseNumberByUnitId.set(c.assigned_unit_id, c.case_number)
        }
      }

      setOpenCases(cases.filter((c) => c.status !== "CLOSED"))
      setUnits(mapApiUnitsToMockUnits(unitsRes.data.units, caseNumberByUnitId))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const counts = useMemo(
    () => ({
      available: units.filter((u) => u.status === "available").length,
      dispatched: units.filter((u) => u.status === "dispatched").length,
      on_scene: units.filter((u) => u.status === "on_scene").length,
      offline: units.filter((u) => u.status === "offline").length,
    }),
    [units]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return units.filter((u) => {
      const matchSearch =
        !q ||
        u.id.toLowerCase().includes(q) ||
        u.officer.toLowerCase().includes(q) ||
        u.zone.toLowerCase().includes(q) ||
        u.vehicle.toLowerCase().includes(q) ||
        u.activeCase?.toLowerCase().includes(q)
      const matchStatus = statusFilter === "all" || u.status === statusFilter
      const matchProvince = provinceFilter === "All" || u.province === provinceFilter
      return matchSearch && matchStatus && matchProvince
    })
  }, [units, search, statusFilter, provinceFilter])

  const handleDispatch = async () => {
    if (!dispatchUnit || !selectedCase) return
    const targetCase = openCases.find((c) => c.uuid === selectedCase)
    if (!targetCase) return

    const { error: unitError, status: unitStatus } = await updateAdminUnit(dispatchUnit.uuid, {
      status: "dispatched",
    })
    if (unitStatus === 401) {
      clearAdminSession()
      return
    }
    if (unitError) {
      toast.error(unitError)
      return
    }

    const { error: caseError, status: caseStatus } = await updateAdminCase(targetCase.uuid, {
      assigned_unit_id: dispatchUnit.uuid,
    })
    if (caseStatus === 401) {
      clearAdminSession()
      return
    }
    if (caseError) {
      toast.error(caseError)
      return
    }

    setUnits((prev) =>
      prev.map((u) =>
        u.uuid === dispatchUnit.uuid
          ? { ...u, status: "dispatched" as UnitStatus, activeCase: targetCase.id, lastUpdated: "Just now" }
          : u
      )
    )
    toast.success(`${dispatchUnit.id} dispatched to ${targetCase.id}`)
    setDispatchUnit(null)
    setSelectedCase("")
  }

  const markAvailable = async (unit: MockUnit) => {
    const { error, status } = await updateAdminUnit(unit.uuid, { status: "available" })
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }

    setUnits((prev) =>
      prev.map((u) =>
        u.uuid === unit.uuid
          ? { ...u, status: "available" as UnitStatus, activeCase: undefined, lastUpdated: "Just now" }
          : u
      )
    )
    toast.success("Unit marked available")
  }

  const toggleStatusFilter = (status: UnitStatus) => {
    setStatusFilter((prev) => (prev === status ? "all" : status))
  }

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-9 w-48" />
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </PageTransition>
    )
  }

  if (loadError) {
    return (
      <PageTransition>
        <p className="text-sm text-red-400">{loadError}</p>
        <button type="button" onClick={loadData} className="admin-btn-ghost mt-3 text-xs">
          Retry
        </button>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[28px] italic text-white">Field Units</h1>
          <p className="mt-1 text-sm text-white/40">
            Live patrol unit status, dispatch control, and regional coverage
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/45">
          <Radio className="h-3.5 w-3.5 text-emerald-400/80" />
          {units.length - counts.offline} of {units.length} units online
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_CARDS.map(({ status, label, icon }) => (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatusFilter(status)}
            className={cn(
              "text-left transition",
              statusFilter === status && "ring-1 ring-white/15 rounded-lg"
            )}
          >
            <StatCard
              label={label}
              value={counts[status]}
              icon={icon}
              animate={false}
              pulse={status === "on_scene"}
            />
          </button>
        ))}
      </div>

      <div className="admin-card overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-body text-sm font-medium text-white/90">Unit Registry</h2>
            <p className="mt-0.5 text-xs text-white/35">
              Showing {filtered.length} of {units.length} units
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search units..."
                className="admin-input w-44 pl-8 text-xs"
              />
            </div>
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="admin-input w-36 text-xs">
                <SelectValue placeholder="Province" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0A0A0A]">
                <SelectItem value="All">All Provinces</SelectItem>
                {NEPAL_PROVINCES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as UnitStatus | "all")}
            >
              <SelectTrigger className="admin-input w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0A0A0A]">
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                {["Unit", "Region", "Officer", "Vehicle", "Status", "Active Case", "Updated", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-white/35 italic">
                    No units match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((unit) => {
                  const { rank, name } = parseOfficer(unit.officer)
                  return (
                    <tr
                      key={unit.uuid}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-mono-admin text-xs text-white">{unit.id}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-white/85">{unit.province}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {unit.zone}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {rank && (
                            <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono-admin text-[10px] text-white/45">
                              {rank}
                            </span>
                          )}
                          <span className="text-white/85">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono-admin text-xs text-white/55">
                          <Car className="h-3.5 w-3.5 shrink-0 text-white/25" />
                          {unit.vehicle}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <UnitStatusBadge status={unit.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {unit.activeCase ? (
                          <Link
                            href={getCaseHref(unit.activeCase)}
                            className="font-mono-admin text-xs text-white/60 transition hover:text-white"
                          >
                            {unit.activeCase}
                          </Link>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/40">{unit.lastUpdated}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          {unit.status === "available" && (
                            <button
                              type="button"
                              onClick={() => setDispatchUnit(unit)}
                              className="admin-btn-primary px-2.5 py-1 text-[10px]"
                            >
                              Dispatch
                            </button>
                          )}
                          {unit.status !== "available" && unit.status !== "offline" && (
                            <button
                              type="button"
                              onClick={() => markAvailable(unit)}
                              className="admin-btn-ghost px-2.5 py-1 text-[10px]"
                            >
                              Mark Available
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-white/[0.02] text-xs text-white/45">
                  <td className="px-5 py-3 font-medium text-white/55" colSpan={2}>
                    {filtered.length} units displayed
                  </td>
                  <td className="px-5 py-3" colSpan={3}>
                    {counts.dispatched + counts.on_scene} actively deployed
                  </td>
                  <td className="px-5 py-3 font-mono-admin" colSpan={3}>
                    {counts.available} ready for dispatch
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Dialog open={!!dispatchUnit} onOpenChange={() => setDispatchUnit(null)}>
        <DialogContent className="border-white/10 bg-[#0A0A0A] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch {dispatchUnit?.id}</DialogTitle>
            <DialogDescription className="text-white/45">
              Assign this unit to an open incident case
            </DialogDescription>
          </DialogHeader>

          {dispatchUnit && (
            <div className="rounded-lg border border-white/5 bg-black/40 p-3 text-sm">
              <p className="text-white/80">{dispatchUnit.officer}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                <MapPin className="h-3 w-3" />
                {dispatchUnit.zone}, {dispatchUnit.province}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono-admin text-xs text-white/45">
                <Car className="h-3 w-3" />
                {dispatchUnit.vehicle}
              </p>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[10px] font-mono-admin tracking-wider text-white/40 uppercase">
              Select Case
            </p>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="admin-input">
                <SelectValue placeholder="Choose an open case" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0A0A0A]">
                {openCases.map((c) => (
                  <SelectItem key={c.uuid} value={c.uuid}>
                    {c.id} — {c.victim} · {c.district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" onClick={() => setDispatchUnit(null)} className="admin-btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDispatch}
              disabled={!selectedCase}
              className="admin-btn-primary disabled:opacity-40"
            >
              Confirm Dispatch
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
