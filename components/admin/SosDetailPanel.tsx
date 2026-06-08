"use client"

import Link from "next/link"
import { MapPin, Lock } from "lucide-react"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import { getInitials, type MockSosAlert } from "@/lib/admin/mock-data"

interface SosDetailPanelProps {
  alert: MockSosAlert | null
}

export default function SosDetailPanel({ alert }: SosDetailPanelProps) {
  if (!alert) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-white/5 bg-[#0A0A0A]">
        <p className="font-display text-lg italic text-white/30">Select an alert to view details</p>
      </div>
    )
  }

  return (
    <div className="sticky top-20 space-y-5 rounded-xl border border-white/5 bg-[#0A0A0A] p-5">
      {/* Victim Profile */}
      <section>
        <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">Victim Profile</h3>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C0392B]/20 text-sm font-medium text-[#C0392B]">
            {getInitials(alert.victim)}
          </div>
          <div>
            <p className="font-display text-2xl italic text-white">{alert.victim}</p>
            <p className="mt-1 text-sm text-white/60">Age {alert.age} · {alert.bloodType} · {alert.phone}</p>
            {alert.priority === "CRITICAL" && (
              <span className="mt-2 inline-block rounded bg-[#C0392B]/20 px-2 py-0.5 text-[10px] font-mono-admin text-[#C0392B] uppercase">
                Nepal Police Priority Case
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">Location</h3>
        <div className="flex h-32 items-center justify-center rounded-lg bg-white/5">
          <div className="text-center">
            <MapPin className="mx-auto h-6 w-6 text-white/30" />
            <p className="mt-2 font-mono-admin text-xs text-white/50">
              Lat: {alert.lat} | Lng: {alert.lng}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/70">{alert.district}, {alert.ward}</p>
        <p className="text-sm text-white/50">{alert.address}</p>
      </section>

      {/* Timeline */}
      <section>
        <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">SOS Timeline</h3>
        <div className="space-y-3 border-l border-white/10 pl-4">
          {alert.timeline.map((event, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#C0392B]" />
              <p className="font-mono-admin text-[10px] text-white/40">{event.time}</p>
              <p className="text-sm text-white/80">{event.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Contacts */}
      {alert.emergencyContacts.length > 0 && (
        <section>
          <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">Emergency Contacts</h3>
          <ul className="space-y-2">
            {alert.emergencyContacts.map((c) => (
              <li key={c.phone} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{c.relation}: {c.name} · {c.phone}</span>
                {c.notified && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Notified</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Assigned Unit */}
      {alert.assignedUnit && (
        <section>
          <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">Assigned Unit</h3>
          <div className="rounded-lg border border-white/5 p-3 text-sm">
            <p className="text-white">{alert.assignedUnit.name} — {alert.assignedUnit.officer}</p>
            <p className="text-white/50">{alert.assignedUnit.vehicle}</p>
            <span className="mt-1 inline-block text-xs text-blue-400">{alert.assignedUnit.status}</span>
          </div>
          <button className="admin-btn-ghost mt-2 text-xs">Reassign Unit</button>
        </section>
      )}

      {/* Actions */}
      <section className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">Mark Resolved</button>
        <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-500">Escalate Case</button>
        <Link href={`/admin/cases/${alert.id}`} className="admin-btn-ghost text-sm">View Full Case</Link>
        <button disabled className="admin-btn-ghost flex items-center gap-1 text-sm opacity-40">
          <Lock className="h-3 w-3" /> Download Evidence
        </button>
      </section>
    </div>
  )
}
