import type { FamilyRelation } from "@/lib/dashboard/police-types"

export const relationLabels: Record<FamilyRelation, string> = {
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
  guardian: "Guardian",
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
