"use client"

import Image from "next/image"
import {
  AlertTriangle,
  Droplet,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  User,
  Watch,
  X,
} from "lucide-react"
import type { SosAlert } from "@/lib/dashboard/mock-data"
import { mapsUrl, relationLabels } from "@/lib/dashboard/mock-data"
import { cn } from "@/lib/utils"

interface VictimProfilePanelProps {
  alert: SosAlert
  onClose?: () => void
  compact?: boolean
}

function statusBadge(status: SosAlert["status"]) {
  const map = {
    critical: "bg-[#C0392B]/20 text-[#E74C3C] border-[#C0392B]/40",
    responding: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        map[status]
      )}
    >
      {status}
    </span>
  )
}

export default function VictimProfilePanel({
  alert,
  onClose,
  compact = false,
}: VictimProfilePanelProps) {
  const { victim, liveLocation } = alert
  const mapsLink = mapsUrl(liveLocation.lat, liveLocation.lng)

  return (
    <div
      className={cn(
        "rounded-lg border bg-[#111]",
        alert.status === "critical"
          ? "border-[#C0392B]/50 shadow-[0_0_24px_rgba(192,57,43,0.12)]"
          : "border-[#222]"
      )}
    >
      {/* Header — double-tap alert */}
      <div className="flex items-start justify-between gap-3 border-b border-[#222] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C0392B]/20">
            <Watch className="h-4 w-4 text-[#C0392B]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
              Wristband double-tap SOS
            </p>
            <p className="font-mono text-[10px] text-[#666]">
              {alert.id} · {alert.triggeredAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(alert.status)}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-[#666] transition-colors hover:bg-[#222] hover:text-[#FAFAFA]"
              aria-label="Close profile"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={cn("p-4", compact ? "space-y-4" : "space-y-5")}>
        {/* Victim photo + core info */}
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded border border-[#333] bg-[#0a0a0a]">
            <Image
              src={victim.photoUrl}
              alt={victim.fullName}
              fill
              className="object-cover"
              sizes="96px"
              priority={alert.status === "critical"}
            />
            {alert.status === "critical" && (
              <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C0392B] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#C0392B]" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#FAFAFA]">{victim.fullName}</h3>
            <p className="mt-0.5 text-xs text-[#888]">
              {alert.district} · {alert.ward}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <InfoChip icon={User} label="Age" value={`${victim.age} years`} />
              <InfoChip icon={Droplet} label="Blood type" value={victim.bloodType} />
            </div>
            <a
              href={`tel:${victim.phone.replace(/\s/g, "")}`}
              className="mt-3 inline-flex items-center gap-2 text-sm text-[#C0392B] transition-colors hover:text-[#E74C3C]"
            >
              <Phone className="h-3.5 w-3.5" />
              {victim.phone}
            </a>
          </div>
        </div>

        {/* Live location */}
        <section className="rounded border border-[#222] bg-[#0a0a0a] p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#C0392B]" />
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[#FAFAFA]">
                Live location
              </h4>
              <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                LIVE
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#666]">
              ±{liveLocation.accuracyMeters}m · {liveLocation.lastUpdated}
            </span>
          </div>
          <p className="text-sm text-[#ccc]">{liveLocation.address}</p>
          <p className="mt-1 font-mono text-[10px] text-[#666]">{alert.coordinates}</p>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-[#C0392B]/40 bg-[#C0392B]/10 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[#E74C3C] transition-colors hover:bg-[#C0392B]/20"
          >
            <MapPin className="h-3.5 w-3.5" />
            Open live map
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </section>

        {/* Emergency contacts */}
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#888]">
            <AlertTriangle className="h-3.5 w-3.5 text-[#C0392B]" />
            Family & emergency contacts
          </h4>
          {victim.emergencyContacts.length === 0 ? (
            <p className="text-xs text-[#555]">No family contacts on file.</p>
          ) : (
            <ul className="space-y-2">
              {victim.emergencyContacts.map((contact) => (
                <li
                  key={`${contact.relation}-${contact.phone}`}
                  className="flex items-center justify-between gap-3 rounded border border-[#222] bg-[#0a0a0a] px-3 py-2.5"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#666]">
                      {relationLabels[contact.relation]}
                    </p>
                    <p className="text-sm font-medium text-[#FAFAFA]">{contact.name}</p>
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="flex shrink-0 items-center gap-1.5 rounded border border-[#333] px-2.5 py-1.5 text-[10px] text-[#ccc] transition-colors hover:border-[#C0392B] hover:text-[#FAFAFA]"
                  >
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {alert.status !== "resolved" && (
          <button
            type="button"
            className="w-full rounded border border-[#C0392B] bg-[#C0392B] py-3 text-[11px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#AA1122]"
          >
            Dispatch nearest unit
          </button>
        )}
      </div>
    </div>
  )
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded border border-[#222] bg-[#0a0a0a] px-2.5 py-2">
      <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-[#666]">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 text-xs font-medium text-[#FAFAFA]">{value}</p>
    </div>
  )
}
