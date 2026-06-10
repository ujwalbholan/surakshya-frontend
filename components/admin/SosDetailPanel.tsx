"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import {
  Car,
  Droplet,
  ExternalLink,
  Lock,
  MapPin,
  Phone,
  Siren,
  User,
  Watch,
} from "lucide-react"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import { cn } from "@/lib/utils"
import { mapsUrl } from "@/lib/admin/sos-data"
import { getInitials, MOCK_CASES, type MockSosAlert } from "@/lib/admin/mock-data"

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
      {children}
    </h3>
  )
}

interface SosDetailPanelProps {
  alert: MockSosAlert | null
  onResolve?: (id: string) => void
  onEscalate?: (id: string) => void
}

export default function SosDetailPanel({ alert, onResolve, onEscalate }: SosDetailPanelProps) {
  if (!alert) {
    return (
      <div className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0A0A0A] px-8 text-center">
        <Siren className="h-10 w-10 text-white/10" />
        <p className="mt-4 font-display text-xl italic text-white/35">Select an alert to view details</p>
        <p className="mt-2 max-w-xs text-sm text-white/25">
          Choose an incoming SOS from the queue to review victim profile, location, and response timeline
        </p>
      </div>
    )
  }

  const relatedCase = MOCK_CASES.find((c) => c.victim === alert.victim)
  const mapsLink = mapsUrl(alert.lat, alert.lng)
  const isCritical = alert.priority === "CRITICAL" && alert.status !== "Resolved"

  return (
    <div
      className={cn(
        "flex h-full max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-xl border bg-[#0A0A0A]",
        isCritical ? "border-[#C0392B]/30 shadow-[0_0_32px_rgba(192,57,43,0.08)]" : "border-white/5"
      )}
    >
      <div className="shrink-0 border-b border-white/5 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C0392B]/20 bg-[#C0392B]/10">
              <Watch className="h-4 w-4 text-[#C0392B]" />
            </div>
            <div>
              <p className="font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
                Wristband SOS Trigger
              </p>
              <p className="mt-0.5 font-mono-admin text-sm text-white/70">{alert.id}</p>
              <p className="mt-0.5 text-xs text-white/40">Triggered {alert.timeAgo}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <PriorityBadge priority={alert.priority} />
            <StatusBadge status={alert.status} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section>
          <SectionHeading>Victim Profile</SectionHeading>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-medium",
                isCritical ? "bg-[#C0392B]/20 text-[#C0392B]" : "bg-white/5 text-white/80"
              )}
            >
              {getInitials(alert.victim)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight italic text-white">{alert.victim}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-white/30" />
                  Age {alert.age}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-white/30" />
                  {alert.bloodType}
                </span>
                <a
                  href={`tel:${alert.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-1.5 transition hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 text-white/30" />
                  {alert.phone}
                </a>
              </div>
              {isCritical && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded border border-[#C0392B]/30 bg-[#C0392B]/10 px-2 py-1 text-[10px] font-mono-admin tracking-wider text-[#C0392B] uppercase">
                  <Siren className="h-3 w-3" />
                  Nepal Police Priority Case
                </span>
              )}
            </div>
          </div>
        </section>

        <section>
          <SectionHeading>Location</SectionHeading>
          <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,57,43,0.08),transparent_70%)]" />
            <div className="relative text-center">
              <MapPin className="mx-auto h-7 w-7 text-[#C0392B]/60" />
              <p className="mt-2 font-mono-admin text-xs text-white/50">
                {alert.lat.toFixed(4)}°N · {alert.lng.toFixed(4)}°E
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/80">
            {alert.district}, {alert.ward}
          </p>
          <p className="mt-0.5 text-sm text-white/45">{alert.address}</p>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-ghost mt-3 inline-flex items-center gap-1.5 text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        </section>

        <section>
          <SectionHeading>SOS Timeline</SectionHeading>
          <div className="space-y-0 border-l border-white/10 pl-4">
            {[...alert.timeline].reverse().map((event, i, arr) => (
              <div key={`${event.time}-${event.description}`} className="relative pb-4 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[21px] top-1.5 h-2 w-2 rounded-full",
                    i === 0 ? "bg-[#C0392B] ring-2 ring-[#C0392B]/20" : "bg-white/25"
                  )}
                />
                <p className="font-mono-admin text-[10px] text-white/40">{event.time}</p>
                <p className={cn("text-sm", i === 0 ? "text-white/90" : "text-white/65")}>
                  {event.description}
                </p>
                {i < arr.length - 1 && <span className="sr-only">Earlier event</span>}
              </div>
            ))}
          </div>
        </section>

        {alert.emergencyContacts.length > 0 && (
          <section>
            <SectionHeading>Emergency Contacts</SectionHeading>
            <ul className="space-y-2">
              {alert.emergencyContacts.map((contact) => (
                <li
                  key={contact.phone}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white/80">
                      <span className="text-white/45">{contact.relation}:</span> {contact.name}
                    </p>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="mt-0.5 inline-flex items-center gap-1 font-mono-admin text-xs text-white/50 transition hover:text-white"
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                  </div>
                  {contact.notified ? (
                    <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Notified
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-white/25">Pending</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {alert.assignedUnit && (
          <section>
            <SectionHeading>Assigned Unit</SectionHeading>
            <div className="rounded-lg border border-white/5 bg-black/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{alert.assignedUnit.name}</p>
                  <p className="mt-0.5 text-sm text-white/55">{alert.assignedUnit.officer}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-mono-admin text-xs text-white/40">
                    <Car className="h-3.5 w-3.5" />
                    {alert.assignedUnit.vehicle}
                  </p>
                </div>
                <span className="rounded border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-400">
                  {alert.assignedUnit.status}
                </span>
              </div>
              <Link href="/admin/units" className="admin-btn-ghost mt-3 inline-block text-xs">
                Manage units →
              </Link>
            </div>
          </section>
        )}
      </div>

      <section className="shrink-0 border-t border-white/5 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {alert.status !== "Resolved" && (
            <>
              <button
                type="button"
                onClick={() => onResolve?.(alert.id)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-500"
              >
                Mark Resolved
              </button>
              <button
                type="button"
                onClick={() => onEscalate?.(alert.id)}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-400 transition hover:bg-orange-500/20"
              >
                Escalate Case
              </button>
            </>
          )}
          <Link href={`/admin/sos/${alert.id}`} className="admin-btn-ghost text-sm">
            View Alert Record
          </Link>
          {relatedCase && (
            <Link href={`/admin/cases/${relatedCase.id}`} className="admin-btn-ghost text-sm">
              View Incident Case
            </Link>
          )}
          <button
            type="button"
            disabled
            className="admin-btn-ghost inline-flex items-center gap-1.5 text-sm opacity-40"
          >
            <Lock className="h-3.5 w-3.5" />
            Download Evidence
          </button>
        </div>
      </section>
    </div>
  )
}
