"use client"

import { useRelativeTime } from "@/hooks/useRelativeTime"

export default function RelativeTime({
  iso,
  fallback,
  className,
}: {
  iso?: string
  fallback?: string
  className?: string
}) {
  const label = useRelativeTime(iso)
  return <span className={className}>{iso ? label : fallback ?? "—"}</span>
}
