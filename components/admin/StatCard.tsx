"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  accent?: "blue" | "crimson" | "green" | "yellow" | "purple"
  loading?: boolean
  animate?: boolean
  pulse?: boolean
}

const ACCENT_COLORS = {
  blue: "text-blue-400",
  crimson: "text-[#C0392B]",
  green: "text-emerald-400",
  yellow: "text-yellow-400",
  purple: "text-purple-400",
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  loading = false,
  animate = true,
  pulse = false,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(animate ? 0 : value)
  const animated = useRef(false)

  useEffect(() => {
    if (!animate || animated.current || loading) {
      setDisplayValue(value)
      return
    }

    const numMatch = String(value).match(/^([\d.]+)(.*)$/)
    if (!numMatch) {
      setDisplayValue(value)
      return
    }

    const target = parseFloat(numMatch[1])
    const suffix = numMatch[2] || ""
    const isFloat = numMatch[1].includes(".")
    const start = performance.now()
    const duration = 800

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased
      setDisplayValue(isFloat ? current.toFixed(1) + suffix : Math.round(current) + suffix)
      if (progress < 1) requestAnimationFrame(tick)
      else animated.current = true
    }

    requestAnimationFrame(tick)
  }, [value, animate, loading])

  if (loading) {
    return (
      <div className="admin-card">
        <Skeleton className="h-3 w-20 bg-white/5" />
        <Skeleton className="mt-3 h-8 w-16 bg-white/5" />
      </div>
    )
  }

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-white/50">{label}</p>
        <div className="relative">
          <Icon className={cn("h-4 w-4", ACCENT_COLORS[accent])} />
          {pulse && (
            <span className="admin-pulse-dot absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
      </div>
      <p className={cn("mt-2 text-2xl font-semibold text-white", ACCENT_COLORS[accent])}>
        {displayValue}
      </p>
    </div>
  )
}
