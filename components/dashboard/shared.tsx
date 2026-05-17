import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#FAFAFA]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#888]">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  className,
}: {
  label: string
  value: string
  hint?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#222] bg-[#111] p-4 transition-colors hover:border-[#333]",
        className
      )}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#666]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#FAFAFA]">{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-[10px]",
            trend === "down" ? "text-emerald-500" : trend === "up" ? "text-[#C0392B]" : "text-[#666]"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export function Panel({
  title,
  icon: Icon,
  children,
  headerRight,
  className,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  headerRight?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border border-[#222] bg-[#111]", className)}>
      <div className="flex items-center justify-between border-b border-[#222] px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-[#C0392B]" />}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
            {title}
          </h3>
        </div>
        {headerRight}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function StatusPill({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "critical" | "warning" | "success" | "muted" | "default"
}) {
  const styles = {
    critical: "bg-[#C0392B]/20 text-[#E74C3C] border-[#C0392B]/40",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    muted: "bg-[#1a1a1a] text-[#888] border-[#333]",
    default: "bg-[#1a1a1a] text-[#ccc] border-[#333]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        styles[variant]
      )}
    >
      {children}
    </span>
  )
}
