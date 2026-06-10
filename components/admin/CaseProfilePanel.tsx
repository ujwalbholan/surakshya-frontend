"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  Clock,
  FileAudio,
  FileJson,
  FileText,
  Lock,
  MapPin,
  Shield,
  User,
} from "lucide-react"
import { CaseStatusBadge, PriorityBadge } from "@/components/admin/Badges"
import {
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
import { cn } from "@/lib/utils"
import {
  getInitials,
  type CaseStatus,
  type MockCase,
} from "@/lib/admin/mock-data"

const STATUS_OPTIONS: { status: CaseStatus; label: string }[] = [
  { status: "OPEN", label: "Open" },
  { status: "INVESTIGATING", label: "Investigating" },
  { status: "CLOSED", label: "Closed" },
  { status: "ESCALATED", label: "Escalated" },
]

const STATUS_DOT: Record<CaseStatus, string> = {
  OPEN: "bg-blue-400",
  INVESTIGATING: "bg-yellow-400",
  CLOSED: "bg-emerald-400",
  ESCALATED: "bg-[#C0392B]",
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function EvidenceIcon({ filename }: { filename: string }) {
  if (filename.endsWith(".aes")) return <FileAudio className="h-3.5 w-3.5 shrink-0 text-white/40" />
  if (filename.endsWith(".json")) return <FileJson className="h-3.5 w-3.5 shrink-0 text-white/40" />
  return <FileText className="h-3.5 w-3.5 shrink-0 text-white/40" />
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
      {children}
    </h3>
  )
}

interface CaseProfilePanelProps {
  caseData: MockCase
  onStatusChange: (status: CaseStatus) => void
  onNoteSave: (note: string) => void
}

export default function CaseProfilePanel({
  caseData,
  onStatusChange,
  onNoteSave,
}: CaseProfilePanelProps) {
  const [note, setNote] = useState("")

  const handleSaveNote = () => {
    const trimmed = note.trim()
    if (!trimmed) return
    onNoteSave(trimmed)
    setNote("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/5 px-6 pt-2 pb-5">
        <SheetHeader className="p-0">
          <p className="font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
            Case Profile
          </p>
          <SheetTitle className="mt-1 font-mono-admin text-sm font-medium tracking-wide text-white/70">
            {caseData.id}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-medium text-white/80">
            {getInitials(caseData.victim)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight italic text-white">
              {caseData.victim}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {caseData.district}, {caseData.province}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={caseData.priority} />
          <CaseStatusBadge status={caseData.status} />
          <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
            <Clock className="h-3 w-3" />
            {caseData.timeSince} ago
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-white/5 bg-black/40 p-3 text-sm">
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Officer</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-white/80">
              <User className="h-3.5 w-3.5 shrink-0 text-white/35" />
              <span className="truncate">{caseData.officer}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Opened</p>
            <p className="mt-0.5 text-white/80">{formatTimestamp(caseData.openedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Evidence</p>
            <p className="mt-0.5 text-white/80">{caseData.evidenceCount} encrypted files</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Status</p>
            <Select value={caseData.status} onValueChange={(v) => onStatusChange(v as CaseStatus)}>
              <SelectTrigger className="mt-0.5 h-8 border-white/10 bg-[#0A0A0A] px-2 text-xs text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0A0A0A]">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.status} value={opt.status}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section>
          <SectionHeading>Evidence Files</SectionHeading>
          {caseData.evidenceFiles.length === 0 ? (
            <p className="text-sm text-white/35 italic">No evidence files attached</p>
          ) : (
            <ul className="space-y-2">
              {caseData.evidenceFiles.map((file) => (
                <li
                  key={file}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 transition hover:border-white/10"
                >
                  <EvidenceIcon filename={file} />
                  <span className="min-w-0 flex-1 truncate font-mono-admin text-xs text-white/80">
                    {file}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-white/30">
                    <Lock className="h-3 w-3" />
                    AES-256
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionHeading>Notes</SectionHeading>
          {caseData.notes.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {caseData.notes.map((entry, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/70"
                >
                  {entry}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-white/35 italic">No notes yet</p>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an investigation note..."
            rows={3}
            className="resize-none border-white/10 bg-black text-sm text-white placeholder:text-white/25"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveNote()
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-white/25">⌘ + Enter to save</p>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!note.trim()}
              className="admin-btn-primary text-xs disabled:opacity-40"
            >
              Save Note
            </button>
          </div>
        </section>

        <section>
          <SectionHeading>Status History</SectionHeading>
          <div className="space-y-0 border-l border-white/10 pl-4">
            {[...caseData.statusHistory].reverse().map((entry, i, arr) => (
              <div key={`${entry.timestamp}-${entry.status}`} className="relative pb-4 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full",
                    STATUS_DOT[entry.status],
                    i === 0 && "ring-2 ring-white/10"
                  )}
                />
                <p className="font-mono-admin text-[10px] text-white/40">
                  {formatTimestamp(entry.timestamp)}
                </p>
                <p className="text-sm text-white/80">{entry.status.replace("_", " ")}</p>
                {i < arr.length - 1 && (
                  <span className="sr-only">Previous status change</span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 pt-4">
          <Link
            href={`/admin/cases/${caseData.id}`}
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <Shield className="h-3.5 w-3.5" />
            View full case record →
          </Link>
        </section>
      </div>
    </div>
  )
}
