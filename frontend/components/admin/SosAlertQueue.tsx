"use client"

import { cn } from "@/lib/utils"
import { Car, Clock } from "lucide-react"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import type { MockSosAlert } from "@/lib/admin/mock-data"

interface SosAlertQueueProps {
  alerts: MockSosAlert[]
  selectedId: string | null
  onSelect: (alert: MockSosAlert) => void
  onLoadMore?: () => void
  hasMore?: boolean
  flashIds?: Set<string>
}

const PRIORITY_ACCENT: Record<MockSosAlert["priority"], string> = {
  CRITICAL: "border-l-[#C0392B]",
  HIGH: "border-l-orange-500/80",
  MEDIUM: "border-l-white/25",
  LOW: "border-l-white/10",
}

export default function SosAlertQueue({
  alerts,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore = false,
  flashIds,
}: SosAlertQueueProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-6 text-center">
        <p className="font-display text-lg italic text-white/35">No alerts match your filters</p>
        <p className="mt-1 text-sm text-white/25">Try clearing search or status filters</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-2">
        {alerts.map((alert) => {
          const isSelected = selectedId === alert.id
          const isFlashing = flashIds?.has(alert.id)

          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelect(alert)}
              className={cn(
                "w-full rounded-lg border border-l-4 bg-[#0A0A0A] p-4 text-left transition",
                PRIORITY_ACCENT[alert.priority],
                isSelected
                  ? "border-[#C0392B]/60 bg-[#C0392B]/[0.06] ring-1 ring-[#C0392B]/20"
                  : "border-white/5 hover:border-white/10 hover:bg-white/[0.03]",
                isFlashing && "animate-pulse"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{alert.victim}</p>
                    <span className="font-mono-admin text-[10px] text-white/30">{alert.id}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/50">{alert.location}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-white/35">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.timeAgo}
                    </span>
                    {alert.assignedUnit && (
                      <span className="inline-flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {alert.assignedUnit.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <PriorityBadge priority={alert.priority} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasMore && onLoadMore && (
        <button type="button" onClick={onLoadMore} className="admin-btn-ghost mt-4 w-full text-sm">
          Load more alerts
        </button>
      )}
    </div>
  )
}
