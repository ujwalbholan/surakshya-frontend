"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  loading?: boolean
  animate?: boolean
  pulse?: boolean
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading = false,
  animate = true,
  pulse = false,
}: StatCardProps) {
  const canAnimate =
    animate && !loading && /^([\d.]+)(.*)$/.test(String(value))
  const [displayValue, setDisplayValue] = useState<string | number>(canAnimate ? 0 : value)
  const animated = useRef(false)

  useEffect(() => {
    if (!canAnimate || animated.current) return

    const numMatch = String(value).match(/^([\d.]+)(.*)$/)!
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
  }, [value, canAnimate])

  if (loading) {
    return (
      <div className="admin-card">
        <Skeleton className="h-3 w-20 bg-white/5" />
        <Skeleton className="mt-3 h-8 w-16 bg-white/5" />
      </div>
    )
  }

  const shown = canAnimate && !animated.current ? displayValue : value

  return (
    <div className="admin-card">
      <div className="flex items-center justify-between">
        <p className="font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">{label}</p>
        <div className="relative">
          <Icon className="h-4 w-4 text-white/30" />
          {pulse && (
            <span className="admin-pulse-dot absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white/60" />
          )}
        </div>
      </div>
      <p className={cn("mt-2 text-2xl font-medium tracking-tight text-white")}>
        {shown}
      </p>
    </div>
  )
}
