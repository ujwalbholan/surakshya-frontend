"use client"

import { cn } from "@/lib/utils"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import type { MockSosAlert } from "@/lib/admin/mock-data"

interface SosAlertQueueProps {
  alerts: MockSosAlert[]
  selectedId: string | null
  onSelect: (alert: MockSosAlert) => void
  onLoadMore?: () => void
  flashIds?: Set<string>
}

export default function SosAlertQueue({ alerts, selectedId, onSelect, onLoadMore, flashIds }: SosAlertQueueProps) {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {alerts.map((alert) => {
          const isSelected = selectedId === alert.id
          const borderColor =
            alert.priority === "CRITICAL" ? "border-l-[#C0392B]" :
            alert.priority === "HIGH" ? "border-l-orange-500" :
            "border-l-white/20"

          return (
            <button
              key={alert.id}
              onClick={() => onSelect(alert)}
              className={cn(
                "w-full rounded-lg border bg-[#0A0A0A] p-4 text-left transition",
                borderColor,
                "border-l-4",
                isSelected ? "border border-[#C0392B] bg-[#C0392B]/5" : "border-white/5 hover:bg-white/5",
                flashIds?.has(alert.id) && "animate-pulse"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{alert.victim}</p>
                  <p className="mt-0.5 text-xs text-white/50">{alert.location}</p>
                  <p className="mt-1 font-mono-admin text-[10px] text-white/40">{alert.timeAgo}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PriorityBadge priority={alert.priority} />
                  <StatusBadge status={alert.status} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {onLoadMore && (
        <button onClick={onLoadMore} className="admin-btn-ghost mt-4 w-full text-sm">
          Load more
        </button>
      )}
    </div>
  )
}
