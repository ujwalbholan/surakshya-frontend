"use client"

import { useCallback, useEffect, useState } from "react"
import { Car, MapPin, Phone, Radio, Users } from "lucide-react"
import { Panel, SectionHeader, StatCard, StatusPill } from "@/components/dashboard/shared"
import { fetchPoliceCases, fetchPoliceUnits } from "@/lib/api/police"
import { mapApiUnitToFieldUnit } from "@/lib/dashboard/operations-mappers"
import type { FieldUnit, UnitStatus } from "@/lib/dashboard/operations-data"
import { cn } from "@/lib/utils"

function unitVariant(status: UnitStatus): "critical" | "warning" | "success" | "muted" | "default" {
  if (status === "dispatched" || status === "on_scene") return "warning"
  if (status === "available") return "success"
  if (status === "offline") return "muted"
  return "default"
}

const STATUS_LABELS: Record<UnitStatus, string> = {
  available: "Available",
  dispatched: "Dispatched",
  on_scene: "On scene",
  offline: "Offline",
}

export default function UnitsView() {
  const [fieldUnits, setFieldUnits] = useState<FieldUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [provinceFilter, setProvinceFilter] = useState<string>("all")

  const loadUnits = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    Promise.all([fetchPoliceUnits(), fetchPoliceCases({ limit: 100 })])
      .then(([unitsData, casesData]) => {
        const caseNumberByUnitId = new Map<string, string>()
        for (const c of casesData.cases) {
          if (c.assigned_unit_id && c.status !== "CLOSED") {
            caseNumberByUnitId.set(c.assigned_unit_id, c.case_number)
          }
        }
        setFieldUnits(
          unitsData.units.map((u) =>
            mapApiUnitToFieldUnit(u, caseNumberByUnitId.get(u.id))
          )
        )
        setLoading(false)
      })
      .catch((err: Error) => {
        setLoadError(err.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const provinces = ["all", ...new Set(fieldUnits.map((u) => u.province))]

  const filtered =
    provinceFilter === "all"
      ? fieldUnits
      : fieldUnits.filter((u) => u.province === provinceFilter)

  const available = fieldUnits.filter((u) => u.status === "available").length
  const deployed = fieldUnits.filter((u) => u.status === "dispatched" || u.status === "on_scene").length

  if (loading) {
    return <p className="text-sm text-[#666]">Loading units…</p>
  }

  if (loadError) {
    return (
      <div>
        <p className="text-sm text-red-400">{loadError}</p>
        <button type="button" onClick={loadUnits} className="mt-2 text-xs text-[#888] underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <SectionHeader
        title="Field units & deployment"
        subtitle="Nepal Police response units linked to Surakshya SOS network across all provinces."
        action={
          <button
            type="button"
            className="rounded border border-[#333] px-4 py-2 text-[10px] uppercase tracking-wider text-[#888] hover:border-[#C0392B] hover:text-[#FAFAFA]"
          >
            Request backup unit
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total units" value={String(fieldUnits.length)} hint="Surakshya-linked" />
        <StatCard label="Available now" value={String(available)} hint="Ready to dispatch" trend="down" />
        <StatCard label="Deployed" value={String(deployed)} hint="Active response" trend="up" />
        <StatCard label="Avg response" value="—" hint="Station-scoped" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {provinces.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvinceFilter(p)}
            className={cn(
              "rounded border px-3 py-2 text-[10px] uppercase tracking-wider",
              provinceFilter === p
                ? "border-[#C0392B] bg-[#C0392B]/15 text-[#FAFAFA]"
                : "border-[#333] text-[#666] hover:text-[#FAFAFA]"
            )}
          >
            {p === "all" ? "All provinces" : p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full py-12 text-center text-sm text-[#666]">No units found</p>
        ) : filtered.map((unit) => (
          <div
            key={unit.id}
            className="rounded-lg border border-[#222] bg-[#111] p-4 transition-colors hover:border-[#333]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#FAFAFA]">{unit.name}</p>
                <p className="mt-0.5 text-xs text-[#666]">{unit.zone}</p>
              </div>
              <StatusPill variant={unitVariant(unit.status)}>{STATUS_LABELS[unit.status]}</StatusPill>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <p className="flex items-center gap-2 text-[#888]">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {unit.province} Province
              </p>
              <p className="flex items-center gap-2 text-[#888]">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {unit.officers} officers on roster
              </p>
              <p className="flex items-center gap-2 text-[#888]">
                <Car className="h-3.5 w-3.5 shrink-0" />
                {unit.vehicle}
              </p>
              <p className="flex items-center gap-2 text-[#888]">
                <Radio className="h-3.5 w-3.5 shrink-0" />
                Avg response {unit.responseAvg}
              </p>
              {unit.activeCase && (
                <p className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-400">
                  Active: {unit.activeCase}
                </p>
              )}
            </div>

            <a
              href={`tel:${unit.contact.replace(/\s/g, "")}`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-[#333] py-2 text-[10px] uppercase tracking-wider text-[#ccc] hover:border-[#C0392B] hover:text-[#FAFAFA]"
            >
              <Phone className="h-3.5 w-3.5" />
              Contact unit
            </a>
          </div>
        ))}
      </div>

      <Panel title="Deployment guidelines" icon={Radio} className="mt-6">
        <ul className="grid gap-2 text-xs text-[#aaa] sm:grid-cols-2">
          <li>· Critical SOS: dispatch within 60 seconds</li>
          <li>· Kathmandu Valley: Units 9, 12 priority</li>
          <li>· Offline units excluded from auto-dispatch</li>
          <li>· Escalated cases require DSP approval</li>
          <li>· Maintain live GPS link until victim safe</li>
          <li>· Post-incident report within 2 hours</li>
        </ul>
      </Panel>
    </>
  )
}
