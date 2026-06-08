"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import PageTransition from "@/components/admin/PageTransition"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { MOCK_UNITS, MOCK_CASES, type MockUnit, type UnitStatus } from "@/lib/admin/mock-data"

const STATUS_CONFIG: Record<UnitStatus, { label: string; color: string; pulse?: boolean }> = {
  available: { label: "Available", color: "text-emerald-400", pulse: true },
  dispatched: { label: "Dispatched", color: "text-blue-400" },
  on_scene: { label: "On Scene", color: "text-[#C0392B]", pulse: true },
  offline: { label: "Offline", color: "text-white/40" },
}

export default function UnitTable() {
  const [units, setUnits] = useState<MockUnit[]>(MOCK_UNITS)
  const [dispatchUnit, setDispatchUnit] = useState<MockUnit | null>(null)
  const [selectedCase, setSelectedCase] = useState("")

  const counts = {
    available: units.filter((u) => u.status === "available").length,
    dispatched: units.filter((u) => u.status === "dispatched").length,
    on_scene: units.filter((u) => u.status === "on_scene").length,
    offline: units.filter((u) => u.status === "offline").length,
  }

  const handleDispatch = () => {
    if (!dispatchUnit || !selectedCase) return
    setUnits((prev) => prev.map((u) =>
      u.id === dispatchUnit.id ? { ...u, status: "dispatched" as UnitStatus, activeCase: selectedCase } : u
    ))
    toast.success(`${dispatchUnit.id} dispatched to ${selectedCase}`)
    setDispatchUnit(null)
    setSelectedCase("")
  }

  const markAvailable = (id: string) => {
    setUnits((prev) => prev.map((u) =>
      u.id === id ? { ...u, status: "available" as UnitStatus, activeCase: undefined } : u
    ))
    toast.success("Unit marked available")
  }

  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Field Units</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {([
          ["available", "Available", "text-emerald-400"],
          ["dispatched", "Dispatched", "text-blue-400"],
          ["on_scene", "On Scene", "text-[#C0392B]"],
          ["offline", "Offline", "text-white/40"],
        ] as const).map(([key, label, color]) => (
          <div key={key} className="admin-card">
            <p className="text-xs text-white/50">{label}</p>
            <p className={cn("mt-1 text-3xl font-semibold", color)}>{counts[key]}</p>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
              {["Unit ID", "Province", "Zone", "Officer", "Vehicle", "Status", "Active Case", "Last Updated", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const cfg = STATUS_CONFIG[u.status]
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono-admin text-xs text-white">{u.id}</td>
                  <td className="px-4 py-3 text-white/70">{u.province}</td>
                  <td className="px-4 py-3 text-white/60">{u.zone}</td>
                  <td className="px-4 py-3 text-white">{u.officer}</td>
                  <td className="px-4 py-3 font-mono-admin text-xs text-white/50">{u.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-1.5 text-xs", cfg.color)}>
                      {cfg.pulse && <span className="admin-pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono-admin text-xs text-white/40">{u.activeCase ?? "—"}</td>
                  <td className="px-4 py-3 text-white/40">{u.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status === "available" && (
                        <button onClick={() => setDispatchUnit(u)} className="text-xs text-[#C0392B] hover:underline">Dispatch</button>
                      )}
                      {u.status !== "available" && u.status !== "offline" && (
                        <button onClick={() => markAvailable(u.id)} className="text-xs text-white/50 hover:underline">Mark Available</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!dispatchUnit} onOpenChange={() => setDispatchUnit(null)}>
        <DialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <DialogHeader><DialogTitle>Dispatch {dispatchUnit?.id}</DialogTitle></DialogHeader>
          <Select value={selectedCase} onValueChange={setSelectedCase}>
            <SelectTrigger className="admin-input"><SelectValue placeholder="Select case" /></SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0A0A0A]">
              {MOCK_CASES.filter((c) => c.status !== "CLOSED").map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.id} — {c.victim}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDispatchUnit(null)}>Cancel</Button>
            <Button onClick={handleDispatch} className="bg-[#C0392B] hover:bg-[#E74C3C]">Dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
