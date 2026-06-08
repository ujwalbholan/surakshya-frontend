"use client"

import PageTransition from "@/components/admin/PageTransition"
import { Radio, MapPin } from "lucide-react"
import { MOCK_SOS_ALERTS } from "@/lib/admin/mock-data"

export default function LiveCommandPage() {
  const activeAlerts = MOCK_SOS_ALERTS.filter((a) => a.status === "Active")

  return (
    <PageTransition>
      <div className="mb-6 flex items-center gap-3">
        <Radio className="h-5 w-5 text-[#C0392B]" />
        <h1 className="font-display text-[28px] italic text-white">Live Command</h1>
        <span className="admin-live-dot h-2 w-2 rounded-full bg-[#C0392B]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card flex h-80 items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 font-display text-lg italic text-white/40">Live Map — Nepal</p>
            <p className="mt-1 text-sm text-white/30">Map integration coming in next release</p>
          </div>
        </div>

        <div className="admin-card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="admin-live-dot h-2 w-2 rounded-full bg-[#C0392B]" />
            Monitoring Feed
          </h2>
          <ul className="space-y-3">
            {activeAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                <div>
                  <p className="text-sm text-white">{a.victim}</p>
                  <p className="text-xs text-white/50">{a.location}</p>
                </div>
                <span className="font-mono-admin text-[10px] text-[#C0392B]">{a.id}</span>
              </li>
            ))}
            {activeAlerts.length === 0 && (
              <p className="font-display text-center italic text-white/40">No active alerts</p>
            )}
          </ul>
        </div>
      </div>
    </PageTransition>
  )
}
