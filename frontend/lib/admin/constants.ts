export const NEPAL_PROVINCES = [
  "Bagmati",
  "Gandaki",
  "Province 1",
  "Lumbini",
  "Madhesh",
  "Karnali",
  "Sudurpaschim",
] as const

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
