"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { LayoutGrid, List, Lock } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { PriorityBadge } from "@/components/admin/Badges"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
  const [note, setNote] = useState("")
  const [dragging, setDragging] = useState<string | null>(null)

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.victim.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    const matchStatus = statusFilter === "All" || c.status === statusFilter
    const matchProvince = provinceFilter === "All" || c.province === provinceFilter
    return matchSearch && matchStatus && matchProvince
  })

  const handleDrop = (caseId: string, newStatus: CaseStatus) => {
    setCases((prev) => prev.map((c) =>
      c.id === caseId
        ? { ...c, status: newStatus, statusHistory: [...c.statusHistory, { status: newStatus, timestamp: new Date().toISOString() }] }
        : c
    ))
    setDragging(null)
  }

  const saveNote = () => {
    if (!selectedCase || !note.trim()) return
    setCases((prev) => prev.map((c) =>
      c.id === selectedCase.id ? { ...c, notes: [...c.notes, note.trim()] } : c
    ))
    toast.success("Note saved")
    setNote("")
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

      <Sheet open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <SheetContent className="w-full border-white/10 bg-[#0A0A0A] text-white sm:max-w-[480px] overflow-y-auto">
          {selectedCase && (
            <>
              <SheetHeader><SheetTitle>{selectedCase.id}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4">
                <Select
                  value={selectedCase.status}
                  onValueChange={(v) => {
                    handleDrop(selectedCase.id, v as CaseStatus)
                    setSelectedCase({ ...selectedCase, status: v as CaseStatus })
                  }}
                >
                  <SelectTrigger className="admin-input"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0A0A0A]">
                    {COLUMNS.map((c) => <SelectItem key={c.status} value={c.status}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="text-sm">
                  <p className="text-white">{selectedCase.victim} · {selectedCase.district}</p>
                  <p className="text-white/50">Officer: {selectedCase.officer}</p>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Evidence Files</h4>
                  <ul className="space-y-2">
                    {selectedCase.evidenceFiles.map((f) => (
                      <li key={f} className="flex items-center gap-2 rounded border border-white/5 p-2 text-xs">
                        <Lock className="h-3 w-3 text-white/40" />
                        <span className="font-mono-admin">{f}</span>
                        <span className="ml-auto text-white/30">AES-256 Encrypted</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Notes</h4>
                  {selectedCase.notes.map((n, i) => <p key={i} className="mb-1 text-sm text-white/60">{n}</p>)}
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." className="mt-2 border-white/10 bg-black text-white" />
                  <Button onClick={saveNote} className="mt-2 bg-[#C0392B] hover:bg-[#E74C3C]">Save Note</Button>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Status History</h4>
                  {selectedCase.statusHistory.map((h, i) => (
                    <p key={i} className="text-xs text-white/50">{h.timestamp.split("T")[0]} — {h.status}</p>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  )
}
