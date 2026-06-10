"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutGrid, List } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import CaseProfilePanel from "@/components/admin/CaseProfilePanel"
import { PriorityBadge } from "@/components/admin/Badges"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import toast from "react-hot-toast"
import {
  MOCK_CASES,
  NEPAL_PROVINCES,
  type MockCase,
  type CaseStatus,
} from "@/lib/admin/mock-data"

const COLUMNS: { status: CaseStatus; label: string; color: string }[] = [
  { status: "OPEN", label: "Open", color: "text-blue-400 border-blue-400/30" },
  { status: "INVESTIGATING", label: "Investigating", color: "text-yellow-400 border-yellow-400/30" },
  { status: "CLOSED", label: "Closed", color: "text-emerald-400 border-emerald-400/30" },
  { status: "ESCALATED", label: "Escalated", color: "text-[#C0392B] border-[#C0392B]/30" },
]

export default function CaseKanban() {
  const [cases, setCases] = useState<MockCase[]>(MOCK_CASES)
  const [view, setView] = useState<"kanban" | "table">("kanban")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [provinceFilter, setProvinceFilter] = useState<string>("All")
  const [selectedCase, setSelectedCase] = useState<MockCase | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const activeCase = selectedCase
    ? cases.find((c) => c.id === selectedCase.id) ?? selectedCase
    : null

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.victim.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || c.status === statusFilter
    const matchProvince = provinceFilter === "All" || c.province === provinceFilter
    return matchSearch && matchStatus && matchProvince
  })

  const updateCase = (caseId: string, updater: (c: MockCase) => MockCase) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? updater(c) : c)))
    setSelectedCase((prev) => (prev?.id === caseId ? updater(prev) : prev))
  }

  const handleDrop = (caseId: string, newStatus: CaseStatus) => {
    updateCase(caseId, (c) => ({
      ...c,
      status: newStatus,
      statusHistory: [...c.statusHistory, { status: newStatus, timestamp: new Date().toISOString() }],
    }))
    setDragging(null)
  }

  const saveNote = (note: string) => {
    if (!selectedCase) return
    updateCase(selectedCase.id, (c) => ({ ...c, notes: [...c.notes, note] }))
    toast.success("Note saved")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-[28px] italic text-white">Incident Cases</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("kanban")} className={cn("rounded p-2", view === "kanban" ? "bg-white/10 text-white" : "text-white/40")}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button onClick={() => setView("table")} className={cn("rounded p-2", view === "table" ? "bg-white/10 text-white" : "text-white/40")}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases..." className="admin-input w-48" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="admin-input w-36"><SelectValue /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0A0A0A]">
            {["All", "OPEN", "INVESTIGATING", "CLOSED", "ESCALATED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="admin-input w-40"><SelectValue placeholder="Province" /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0A0A0A]">
            <SelectItem value="All">All Provinces</SelectItem>
            {NEPAL_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <div
              key={col.status}
              className="rounded-xl border border-white/5 bg-[#0A0A0A] p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("caseId")
                if (id) handleDrop(id, col.status)
              }}
            >
              <h3 className={cn("mb-3 border-b pb-2 text-xs font-mono-admin uppercase tracking-wider", col.color)}>
                {col.label} ({filtered.filter((c) => c.status === col.status).length})
              </h3>
              <div className="space-y-2 min-h-[100px]">
                {filtered.filter((c) => c.status === col.status).map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("caseId", c.id); setDragging(c.id) }}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setSelectedCase(c)}
                    className={cn(
                      "cursor-pointer rounded-lg border border-white/5 bg-black p-3 transition hover:border-white/10",
                      dragging === c.id && "opacity-50"
                    )}
                  >
                    <p className="font-mono-admin text-[10px] text-white/40">{c.id}</p>
                    <p className="mt-1 text-sm font-medium text-white">{c.victim}</p>
                    <p className="text-xs text-white/50">{c.district}</p>
                    <p className="mt-1 text-xs text-white/40">{c.officer}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Evidence: {c.evidenceCount} files</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <p className="mt-1 text-[10px] text-white/30">{c.timeSince} ago</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] uppercase tracking-wider text-white/40">
                {["Case ID", "Victim", "District", "Officer", "Status", "Priority", "Opened", "Evidence", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono-admin text-xs">{c.id}</td>
                  <td className="px-4 py-3 text-white">{c.victim}</td>
                  <td className="px-4 py-3 text-white/60">{c.district}</td>
                  <td className="px-4 py-3 text-white/60">{c.officer}</td>
                  <td className="px-4 py-3 text-xs capitalize text-white/60">{c.status.toLowerCase()}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-4 py-3 text-white/40">{c.openedAt.split("T")[0]}</td>
                  <td className="px-4 py-3 text-white/40">{c.evidenceCount}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedCase(c)} className="text-xs text-[#C0392B] hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!activeCase} onOpenChange={() => setSelectedCase(null)}>
        <SheetContent className="flex h-full w-full flex-col gap-0 border-white/10 bg-[#0A0A0A] p-0 text-white sm:max-w-[480px]">
          {activeCase && (
            <CaseProfilePanel
              caseData={activeCase}
              onStatusChange={(status) => handleDrop(activeCase.id, status)}
              onNoteSave={saveNote}
            />
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  )
}
