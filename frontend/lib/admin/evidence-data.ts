import { MOCK_CASES, type CaseStatus, type SosPriority } from "@/lib/admin/mock-data"

export type EvidenceFileType = "audio" | "gps" | "document" | "witness"

export interface EvidenceRecord {
  file: string
  type: EvidenceFileType
  typeLabel: string
  caseId: string
  victim: string
  district: string
  province: string
  priority: SosPriority
  caseStatus: CaseStatus
  sizeLabel: string
  capturedAt: string
}

function inferType(filename: string): { type: EvidenceFileType; label: string } {
  if (filename.startsWith("witness_")) return { type: "witness", label: "Witness" }
  if (filename.endsWith(".aes")) return { type: "audio", label: "Audio" }
  if (filename.endsWith(".json")) return { type: "gps", label: "GPS Log" }
  return { type: "document", label: "Document" }
}

function mockSize(filename: string): string {
  const seed = filename.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const kb = 120 + (seed % 2800)
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

function formatCapturedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function buildEvidenceRecords(): EvidenceRecord[] {
  return MOCK_CASES.flatMap((c) =>
    c.evidenceFiles.map((file) => {
      const { type, label } = inferType(file)
      return {
        file,
        type,
        typeLabel: label,
        caseId: c.id,
        victim: c.victim,
        district: c.district,
        province: c.province,
        priority: c.priority,
        caseStatus: c.status,
        sizeLabel: mockSize(file),
        capturedAt: formatCapturedAt(c.openedAt),
      }
    })
  )
}

export function getEvidenceSummary(records: EvidenceRecord[]) {
  return {
    total: records.length,
    cases: new Set(records.map((r) => r.caseId)).size,
    audio: records.filter((r) => r.type === "audio").length,
    gps: records.filter((r) => r.type === "gps").length,
    documents: records.filter((r) => r.type === "document" || r.type === "witness").length,
  }
}

export function groupEvidenceByCase(records: EvidenceRecord[]) {
  const groups = new Map<string, EvidenceRecord[]>()
  for (const record of records) {
    const existing = groups.get(record.caseId) ?? []
    existing.push(record)
    groups.set(record.caseId, existing)
  }
  return Array.from(groups.entries()).map(([caseId, files]) => ({
    caseId,
    victim: files[0].victim,
    district: files[0].district,
    province: files[0].province,
    priority: files[0].priority,
    caseStatus: files[0].caseStatus,
    files,
  }))
}

export function buildEvidenceManifestCsv(records: EvidenceRecord[]) {
  const header = "File,Type,Case ID,Victim,District,Size,Captured At"
  const body = records
    .map((r) =>
      [r.file, r.typeLabel, r.caseId, r.victim, r.district, r.sizeLabel, r.capturedAt]
        .map((v) => `"${v}"`)
        .join(",")
    )
    .join("\n")
  return `${header}\n${body}`
}
