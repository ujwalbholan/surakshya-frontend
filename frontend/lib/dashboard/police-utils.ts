import type { FamilyRelation } from "@/lib/dashboard/police-types"

export const relationLabels: Record<FamilyRelation, string> = {
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`
}
