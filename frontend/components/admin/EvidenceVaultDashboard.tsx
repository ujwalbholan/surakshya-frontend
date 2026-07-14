"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import {
  FileAudio,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderLock,
  LayoutGrid,
  List,
  Lock,
  MapPin,
  Search,
  Shield,
} from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import { CaseStatusBadge, PriorityBadge } from "@/components/admin/Badges"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { fetchAdminEvidence } from "@/lib/api/admin-evidence"
import { clearAdminSession } from "@/lib/auth/admin-session"
import { mapApiEvidenceListToRecords } from "@/lib/admin/evidence-mappers"
import {
  buildEvidenceManifestCsv,
  getEvidenceSummary,
  groupEvidenceByCase,
  type EvidenceFileType,
  type EvidenceRecord,
} from "@/lib/admin/evidence-data"

const TYPE_FILTERS: { value: EvidenceFileType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "audio", label: "Audio" },
  { value: "gps", label: "GPS Log" },
  { value: "document", label: "Document" },
  { value: "witness", label: "Witness" },
]

const TYPE_BADGE_STYLES: Record<EvidenceFileType, string> = {
  audio: "border-[#C0392B]/30 bg-[#C0392B]/10 text-[#E74C3C]",
  gps: "border-blue-400/30 bg-blue-400/10 text-blue-400",
  document: "border-white/15 bg-white/5 text-white/60",
  witness: "border-amber-400/30 bg-amber-400/10 text-amber-400",
}

function EvidenceFileIcon({ filename, className }: { filename: string; className?: string }) {
  if (filename.endsWith(".aes")) {
    return <FileAudio className={cn("h-4 w-4 shrink-0 text-white/40", className)} />
  }
  if (filename.endsWith(".json")) {
    return <FileJson className={cn("h-4 w-4 shrink-0 text-white/40", className)} />
  }
  return <FileText className={cn("h-4 w-4 shrink-0 text-white/40", className)} />
}

function TypeBadge({ type, label }: { type: EvidenceFileType; label: string }) {
  return (
    <span className={cn("admin-badge border text-[10px]", TYPE_BADGE_STYLES[type])}>
      {label}
    </span>
  )
}

function FileRow({
  record,
  onSelect,
  compact = false,
}: {
  record: EvidenceRecord
  onSelect: (record: EvidenceRecord) => void
  compact?: boolean
}) {
  return (
    <tr
      className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.02]"
      onClick={() => onSelect(record)}
    >
      <td className={cn("px-5", compact ? "py-2.5" : "py-3.5")}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/5 bg-black/40">
            <EvidenceFileIcon filename={record.file} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono-admin text-xs text-white/85">{record.file}</p>
            <p className="mt-0.5 text-[10px] text-white/35">{record.sizeLabel}</p>
          </div>
        </div>
      </td>
      {!compact && (
        <>
          <td className="px-5 py-3.5">
            <Link
              href={`/admin/cases/${record.caseId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono-admin text-xs text-white/60 transition hover:text-white"
            >
              {record.caseId}
            </Link>
          </td>
          <td className="px-5 py-3.5">
            <p className="text-white/85">{record.victim}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
              <MapPin className="h-3 w-3" />
              {record.district}
            </p>
          </td>
        </>
      )}
      <td className={cn("px-5", compact ? "py-2.5" : "py-3.5")}>
        <TypeBadge type={record.type} label={record.typeLabel} />
      </td>
      <td className={cn("px-5 text-xs text-white/40", compact ? "py-2.5" : "py-3.5")}>
        {record.capturedAt}
      </td>
      <td className={cn("px-5", compact ? "py-2.5" : "py-3.5")}>
        <button
          type="button"
          disabled
          onClick={(e) => e.stopPropagation()}
          className="admin-btn-ghost inline-flex items-center gap-1 px-2 py-1 text-[10px] opacity-40"
          title="Decryption requires authorized key"
        >
          <Lock className="h-3 w-3" />
          Download
        </button>
      </td>
    </tr>
  )
}

export default function EvidenceVaultDashboard() {
  const [allRecords, setAllRecords] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<EvidenceFileType | "all">("all")
  const [view, setView] = useState<"list" | "grouped">("list")
  const [selectedFile, setSelectedFile] = useState<EvidenceRecord | null>(null)

  const loadEvidence = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetchAdminEvidence({ limit: 100 }).then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        return
      }
      if (error || !data) {
        setLoadError(error ?? "Failed to load evidence")
        setLoading(false)
        return
      }
      setAllRecords(mapApiEvidenceListToRecords(data.evidence))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadEvidence()
  }, [loadEvidence])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allRecords.filter((r) => {
      const matchSearch =
        !q ||
        r.file.toLowerCase().includes(q) ||
        r.caseId.toLowerCase().includes(q) ||
        r.victim.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q)
      const matchType = typeFilter === "all" || r.type === typeFilter
      return matchSearch && matchType
    })
  }, [allRecords, search, typeFilter])

  const summary = useMemo(() => getEvidenceSummary(filtered), [filtered])
  const grouped = useMemo(() => groupEvidenceByCase(filtered), [filtered])

  const exportManifest = () => {
    const csv = buildEvidenceManifestCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "surakshya-evidence-manifest.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Evidence manifest exported")
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[28px] italic text-white">Evidence Vault</h1>
          <p className="mt-1 text-sm text-white/40">
            Tamper-proof incident files secured with end-to-end AES-256 encryption
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-400/80">
          <Shield className="h-3.5 w-3.5" />
          All files encrypted at rest · chain-of-custody enforced
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      ) : loadError ? (
        <div>
          <p className="text-sm text-red-400">{loadError}</p>
          <button type="button" onClick={loadEvidence} className="admin-btn-ghost mt-3 text-xs">
            Retry
          </button>
        </div>
      ) : (
        <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Files" value={summary.total} icon={FolderLock} animate={false} />
        <StatCard label="Linked Cases" value={summary.cases} icon={FileText} animate={false} />
        <StatCard label="Audio Recordings" value={summary.audio} icon={FileAudio} animate={false} />
        <StatCard label="GPS Logs" value={summary.gps} icon={FileJson} animate={false} />
      </div>

      <div className="admin-card overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/5 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-body text-sm font-medium text-white/90">Encrypted File Registry</h2>
            <p className="mt-0.5 text-xs text-white/35">
              Showing {filtered.length} of {allRecords.length} files
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files, cases, victims..."
                className="admin-input w-52 pl-8 text-xs"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as EvidenceFileType | "all")}
            >
              <SelectTrigger className="admin-input w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0A0A0A]">
                {TYPE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "rounded-md p-1.5 transition",
                  view === "list" ? "bg-white/10 text-white" : "text-white/40"
                )}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView("grouped")}
                className={cn(
                  "rounded-md p-1.5 transition",
                  view === "grouped" ? "bg-white/10 text-white" : "text-white/40"
                )}
                aria-label="Grouped view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={exportManifest}
              className="admin-btn-ghost inline-flex items-center gap-1.5 text-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Manifest
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FolderLock className="mx-auto h-8 w-8 text-white/15" />
            <p className="mt-3 font-display text-lg italic text-white/35">No evidence files found</p>
            <p className="mt-1 text-sm text-white/25">Try adjusting your search or filters</p>
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                  {["File", "Case", "Victim", "Type", "Captured", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <FileRow
                    key={`${record.caseId}-${record.file}`}
                    record={record}
                    onSelect={setSelectedFile}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {grouped.map((group) => (
              <div key={group.caseId} className="px-5 py-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/cases/${group.caseId}`}
                        className="font-mono-admin text-xs text-white/70 transition hover:text-white"
                      >
                        {group.caseId}
                      </Link>
                      <CaseStatusBadge status={group.caseStatus} />
                      <PriorityBadge priority={group.priority} />
                    </div>
                    <p className="mt-1 text-white/85">{group.victim}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
                      <MapPin className="h-3 w-3" />
                      {group.district}, {group.province}
                    </p>
                  </div>
                  <p className="text-xs text-white/35">{group.files.length} encrypted files</p>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/35 uppercase">
                        {["File", "Type", "Captured", "Actions"].map((h) => (
                          <th key={h} className="px-5 py-2 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.files.map((record) => (
                        <FileRow
                          key={record.file}
                          record={record}
                          onSelect={setSelectedFile}
                          compact
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="border-t border-white/5 bg-white/[0.02] px-5 py-3 text-xs text-white/40">
            {summary.documents} documents · {summary.audio} audio · {summary.gps} GPS logs · AES-256 on all
            artifacts
          </div>
        )}
      </div>

      <Sheet open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <SheetContent className="flex h-full w-full flex-col gap-0 border-white/10 bg-[#0A0A0A] p-0 text-white sm:max-w-[420px]">
          {selectedFile && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-white/5 px-6 pt-2 pb-5">
                <SheetHeader className="p-0">
                  <p className="font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
                    Evidence File
                  </p>
                  <SheetTitle className="mt-2 font-mono-admin text-sm leading-relaxed text-white/80">
                    {selectedFile.file}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-wrap gap-2">
                  <TypeBadge type={selectedFile.type} label={selectedFile.typeLabel} />
                  <span className="admin-badge border border-emerald-400/20 bg-emerald-400/5 text-emerald-400/80">
                    AES-256
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/5 bg-black/40 p-3">
                  <div>
                    <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Case</p>
                    <Link
                      href={`/admin/cases/${selectedFile.caseId}`}
                      className="mt-0.5 inline-block font-mono-admin text-xs text-white/70 hover:text-white"
                    >
                      {selectedFile.caseId}
                    </Link>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Size</p>
                    <p className="mt-0.5 text-white/80">{selectedFile.sizeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Victim</p>
                    <p className="mt-0.5 text-white/80">{selectedFile.victim}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Captured</p>
                    <p className="mt-0.5 text-white/80">{selectedFile.capturedAt}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Location</p>
                    <p className="mt-0.5 text-white/80">
                      {selectedFile.district}, {selectedFile.province}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/50">
                  <p className="flex items-center gap-2 text-white/70">
                    <Lock className="h-3.5 w-3.5" />
                    Chain of custody
                  </p>
                  <p className="mt-2">
                    File encrypted at capture on victim device. Decryption requires authorized Nepal Police
                    credentials and is logged in the audit trail.
                  </p>
                </div>
              </div>

              <div className="shrink-0 border-t border-white/5 px-6 py-4">
                <button
                  type="button"
                  disabled
                  className="admin-btn-ghost w-full opacity-40"
                  onClick={() => toast("Decryption requires authorized key")}
                >
                  <Lock className="mr-2 inline h-3.5 w-3.5" />
                  Request Decrypted Download
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
        </>
      )}
    </PageTransition>
  )
}
