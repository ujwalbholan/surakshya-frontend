"use client"

import { useMemo, useState } from "react"
import {
  FileText,
  FolderOpen,
  Paperclip,
  Search,
  User,
} from "lucide-react"
import { Panel, SectionHeader, StatCard, StatusPill } from "@/components/dashboard/shared"
// TODO: no backend endpoint yet
import { policeCases, type CaseStatus } from "@/lib/dashboard/operations-data"
import { cn } from "@/lib/utils"

const STATUS_FILTERS: { id: CaseStatus | "all"; label: string }[] = [
  { id: "all", label: "All cases" },
  { id: "open", label: "Open" },
  { id: "investigating", label: "Investigating" },
  { id: "escalated", label: "Escalated" },
  { id: "closed", label: "Closed" },
]

function caseVariant(status: CaseStatus): "critical" | "warning" | "success" | "muted" {
  if (status === "escalated") return "critical"
  if (status === "investigating" || status === "open") return "warning"
  return "success"
}

export default function CasesView() {
  const [filter, setFilter] = useState<CaseStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(policeCases[0]?.id ?? "")

  const filtered = useMemo(() => {
    return policeCases.filter((c) => {
      const matchFilter = filter === "all" || c.status === filter
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.victimName.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.officer.toLowerCase().includes(q)
      return matchFilter && matchSearch
    })
  }, [filter, search])

  const selected = policeCases.find((c) => c.id === selectedId) ?? filtered[0]

  const stats = {
    open: policeCases.filter((c) => c.status === "open").length,
    investigating: policeCases.filter((c) => c.status === "investigating").length,
    escalated: policeCases.filter((c) => c.status === "escalated").length,
    closed: policeCases.filter((c) => c.status === "closed").length,
  }

  return (
    <>
      <SectionHeader
        title="Case files"
        subtitle="Each double-tap SOS generates a case with linked evidence, officer notes, and resolution status."
        action={
          <button
            type="button"
            className="rounded border border-[#C0392B] bg-[#C0392B]/10 px-4 py-2 text-[10px] uppercase tracking-wider text-[#E74C3C] hover:bg-[#C0392B]/20"
          >
            Export case list
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={String(stats.open)} hint="Awaiting assignment" trend="up" />
        <StatCard label="Investigating" value={String(stats.investigating)} hint="Active inquiries" />
        <StatCard label="Escalated" value={String(stats.escalated)} hint="District HQ review" trend="up" />
        <StatCard label="Closed (month)" value={String(stats.closed)} hint="Resolved cases" trend="down" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            type="search"
            placeholder="Search case ID, victim, officer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-[#333] bg-[#0a0a0a] py-2.5 pl-10 pr-4 text-sm text-[#FAFAFA] placeholder:text-[#555] outline-none focus:border-[#C0392B]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded border px-3 py-2 text-[10px] uppercase tracking-wider",
                filter === f.id
                  ? "border-[#C0392B] bg-[#C0392B]/15 text-[#FAFAFA]"
                  : "border-[#333] text-[#666] hover:text-[#FAFAFA]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Panel title="Case registry" icon={FolderOpen} headerRight={
            <span className="font-mono text-[10px] text-[#666]">{filtered.length} cases</span>
          }>
            <div className="max-h-[480px] space-y-2 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full rounded border p-3 text-left transition-colors",
                    selected?.id === c.id
                      ? "border-[#C0392B] bg-[#C0392B]/10"
                      : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-[10px] text-[#888]">{c.id}</p>
                    <StatusPill variant={caseVariant(c.status)}>{c.status}</StatusPill>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[#FAFAFA]">{c.victimName}</p>
                  <p className="mt-0.5 text-xs text-[#666]">{c.district} · {c.openedAt}</p>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-3">
          {selected && (
            <div className="space-y-4">
              <Panel title={selected.id} icon={FileText}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">Linked SOS</p>
                    <p className="mt-1 font-mono text-sm text-[#C0392B]">{selected.sosId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">Priority</p>
                    <p className="mt-1 text-sm text-[#FAFAFA] uppercase">{selected.priority}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">Victim</p>
                    <p className="mt-1 text-sm text-[#FAFAFA]">{selected.victimName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">District</p>
                    <p className="mt-1 text-sm text-[#FAFAFA]">{selected.district}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">Assigned unit</p>
                    <p className="mt-1 text-sm text-[#FAFAFA]">{selected.assignedUnit}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">Lead officer</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[#FAFAFA]">
                      <User className="h-3.5 w-3.5 text-[#666]" />
                      {selected.officer}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-[#222] pt-4">
                  <p className="text-[10px] uppercase tracking-wider text-[#666]">Case summary</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#ccc]">{selected.summary}</p>
                </div>
              </Panel>

              <Panel
                title="Evidence & attachments"
                icon={Paperclip}
                headerRight={
                  <span className="font-mono text-[10px] text-[#666]">
                    {selected.evidenceCount} items
                  </span>
                }
              >
                <ul className="space-y-2 text-xs text-[#aaa]">
                  <li className="flex justify-between rounded border border-[#222] bg-[#0a0a0a] px-3 py-2">
                    <span>GPS track log (full route)</span>
                    <span className="text-emerald-500">Secured</span>
                  </li>
                  <li className="flex justify-between rounded border border-[#222] bg-[#0a0a0a] px-3 py-2">
                    <span>Auto audio recording — SOS window</span>
                    <span className="text-emerald-500">AES-256</span>
                  </li>
                  <li className="flex justify-between rounded border border-[#222] bg-[#0a0a0a] px-3 py-2">
                    <span>Family contact notification log</span>
                    <span className="text-[#888]">3 sent</span>
                  </li>
                  <li className="flex justify-between rounded border border-[#222] bg-[#0a0a0a] px-3 py-2">
                    <span>Officer on-scene report</span>
                    <span className="text-amber-400">Pending</span>
                  </li>
                </ul>
              </Panel>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded bg-[#C0392B] px-4 py-2 text-[10px] uppercase tracking-wider text-white hover:bg-[#AA1122]"
                >
                  Update status
                </button>
                <button
                  type="button"
                  className="rounded border border-[#333] px-4 py-2 text-[10px] uppercase tracking-wider text-[#888] hover:text-[#FAFAFA]"
                >
                  Add officer note
                </button>
                <button
                  type="button"
                  className="rounded border border-[#333] px-4 py-2 text-[10px] uppercase tracking-wider text-[#888] hover:text-[#FAFAFA]"
                >
                  Close case
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
