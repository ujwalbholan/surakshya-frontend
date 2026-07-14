"use client"

import { useState } from "react"
import { useInterval } from "@/hooks/use-interval"
import { formatRelativeTime } from "@/lib/dashboard/sos-mappers"

/** Recomputes "x ago" every `tickMs` so SOS queue times stay live. */
export function useRelativeTime(iso: string | undefined, tickMs = 15_000): string {
  const [, setTick] = useState(0)
  useInterval(() => setTick((n) => n + 1), iso ? tickMs : null)
  if (!iso) return "—"
  return formatRelativeTime(iso)
}
