import type { CaseStatus, SosPriority } from "@/lib/admin/domain-types"

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
