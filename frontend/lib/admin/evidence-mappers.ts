import type { ApiEvidenceRecord } from "@/lib/api/types"
import type { CaseStatus, SosPriority } from "@/lib/admin/mock-data"
import type { EvidenceFileType, EvidenceRecord } from "@/lib/admin/evidence-data"

const TYPE_LABELS: Record<EvidenceFileType, string> = {
  audio: "Audio",
  gps: "GPS Log",
  document: "Document",
  witness: "Witness",
}

function toEvidenceFileType(type: string): EvidenceFileType {
  if (type === "audio" || type === "gps" || type === "document" || type === "witness") {
    return type
  }
  return "document"
}

function toCaseStatus(status: string): CaseStatus {
  const upper = status.toUpperCase() as CaseStatus
  if (["OPEN", "INVESTIGATING", "CLOSED", "ESCALATED"].includes(upper)) {
    return upper
  }
  return "OPEN"
}

function toPriority(priority: string): SosPriority {
  const upper = priority.toUpperCase() as SosPriority
  if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(upper)) {
    return upper
  }
  return "MEDIUM"
}

function formatSize(bytes: string | number): string {
  const n = typeof bytes === "string" ? Number(bytes) : bytes
  if (!Number.isFinite(n) || n < 0) return "—"
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  if (n >= 1024) return `${Math.round(n / 1024)} KB`
  return `${n} B`
}

function formatCapturedAt(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date()
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function mapApiEvidenceToRecord(evidence: ApiEvidenceRecord): EvidenceRecord {
  const fileType = toEvidenceFileType(evidence.file_type)
  const caseInfo = evidence.case

  return {
    file: evidence.file_name,
    type: fileType,
    typeLabel: TYPE_LABELS[fileType],
    caseId: caseInfo?.case_number ?? evidence.case_id,
    victim: caseInfo?.victim_name ?? "—",
    district: caseInfo?.district ?? "—",
    province: caseInfo?.province ?? "—",
    priority: toPriority(caseInfo?.priority ?? "MEDIUM"),
    caseStatus: toCaseStatus(caseInfo?.status ?? "OPEN"),
    sizeLabel: formatSize(evidence.size_bytes),
    capturedAt: formatCapturedAt(evidence.captured_at ?? evidence.created_at),
  }
}

export function mapApiEvidenceListToRecords(items: ApiEvidenceRecord[]): EvidenceRecord[] {
  return items.map(mapApiEvidenceToRecord)
}
