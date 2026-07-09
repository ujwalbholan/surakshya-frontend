"use client"

import { useState } from "react"
import {
  Bell,
  Globe,
  Lock,
  Shield,
  User,
  Mail,
  Smartphone,
} from "lucide-react"
import { Panel, SectionHeader } from "@/components/dashboard/shared"
import {
  notificationSettings,
  systemSettings,
} from "@/lib/dashboard/settings-defaults"
import { getStoredEmail } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#222] py-4 last:border-0">
      <div>
        <p className="text-sm text-[#FAFAFA]">{label}</p>
        <p className="mt-0.5 text-xs text-[#666]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "bg-[#C0392B]" : "bg-[#333]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            enabled ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  )
}

export default function SettingsView() {
  const email = getStoredEmail()
  const [notifications, setNotifications] = useState(notificationSettings)
  const [system, setSystem] = useState(systemSettings)

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    )
  }

  const toggleSystem = (id: string) => {
    setSystem((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  return (
    <>
      <SectionHeader
        title="Settings"
        subtitle="Configure alerts, dispatch behaviour, and officer account preferences."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Officer profile" icon={User}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Email (login)
              </label>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#FAFAFA]">
                <Mail className="h-4 w-4 text-[#666]" />
                {email ?? "—"}
              </p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Badge ID
              </label>
              <p className="mt-1 font-mono text-sm text-[#FAFAFA]">NP-KTM-2847</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Rank & station
              </label>
              <p className="mt-1 text-sm text-[#FAFAFA]">Inspector · Kathmandu Metro HQ</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Duty mobile
              </label>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#FAFAFA]">
                <Smartphone className="h-4 w-4 text-[#666]" />
                +977 985-000-2847
              </p>
            </div>
            <button
              type="button"
              className="w-full rounded border border-[#333] py-2.5 text-[10px] uppercase tracking-wider text-[#888] hover:border-[#C0392B] hover:text-[#FAFAFA]"
            >
              Edit profile
            </button>
          </div>
        </Panel>

        <Panel title="Security" icon={Lock}>
          <div className="space-y-3 text-sm">
            <p className="text-[#aaa]">
              Session secured via Suraksha AMS. Tokens refresh automatically. Sign out on shared terminals.
            </p>
            <button
              type="button"
              className="w-full rounded border border-[#333] py-2.5 text-[10px] uppercase tracking-wider text-[#888] hover:text-[#FAFAFA]"
            >
              Change password
            </button>
            <button
              type="button"
              className="w-full rounded border border-[#333] py-2.5 text-[10px] uppercase tracking-wider text-[#888] hover:text-[#FAFAFA]"
            >
              View login history
            </button>
            <p className="font-mono text-[10px] text-[#555]">
              Last login: Today · Kathmandu · This device
            </p>
          </div>
        </Panel>

        <Panel title="Alert notifications" icon={Bell}>
          {notifications.map((n) => (
            <ToggleRow
              key={n.id}
              label={n.label}
              description={n.description}
              enabled={n.enabled}
              onToggle={() => toggleNotification(n.id)}
            />
          ))}
        </Panel>

        <Panel title="System & dispatch" icon={Shield}>
          {system.map((s) => (
            <ToggleRow
              key={s.id}
              label={s.label}
              description={s.description}
              enabled={s.enabled}
              onToggle={() => toggleSystem(s.id)}
            />
          ))}
        </Panel>

        <Panel title="Regional preferences" icon={Globe} className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Default province filter
              </label>
              <select className="mt-2 w-full rounded border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-[#FAFAFA] outline-none focus:border-[#C0392B]">
                <option>Bagmati</option>
                <option>All provinces</option>
                <option>Gandaki</option>
                <option>Koshi</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Time zone
              </label>
              <p className="mt-2 text-sm text-[#FAFAFA]">Asia/Kathmandu (NPT, UTC+5:45)</p>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#666]">
                Map provider
              </label>
              <p className="mt-2 text-sm text-[#FAFAFA]">Google Maps (live GPS)</p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
