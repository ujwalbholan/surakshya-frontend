"use client"

import type { ReactNode } from "react"
import { Calendar, Mail, Phone, Shield, User } from "lucide-react"
import { RoleBadge, UserStatusBadge } from "@/components/admin/Badges"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { formatJoinDate } from "@/lib/admin/users-data"
import { getInitials } from "@/lib/admin/constants"
import type { MockUser } from "@/lib/admin/domain-types"

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
      {children}
    </h3>
  )
}

interface UserProfilePanelProps {
  user: MockUser
  onDeactivate?: () => void
  onDelete?: () => void
}

export default function UserProfilePanel({ user, onDeactivate, onDelete }: UserProfilePanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/5 px-6 pt-2 pb-5">
        <SheetHeader className="p-0">
          <p className="font-mono-admin text-[10px] tracking-widest text-white/40 uppercase">
            User Profile
          </p>
          <SheetTitle className="sr-only">{user.full_name}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg font-medium text-white/80">
            {getInitials(user.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl leading-tight italic text-white">{user.full_name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <RoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/5 bg-black/40 p-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">User ID</p>
            <p className="mt-0.5 font-mono-admin text-xs text-white/70">{user.id}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Email</p>
            <a
              href={`mailto:${user.email}`}
              className="mt-0.5 inline-flex items-center gap-1.5 text-white/80 transition hover:text-white"
            >
              <Mail className="h-3.5 w-3.5 text-white/30" />
              {user.email}
            </a>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Phone</p>
            <a
              href={`tel:${user.phone.replace(/\s/g, "")}`}
              className="mt-0.5 inline-flex items-center gap-1.5 font-mono-admin text-xs text-white/80 transition hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 text-white/30" />
              {user.phone}
            </a>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Joined</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-white/80">
              <Calendar className="h-3.5 w-3.5 text-white/30" />
              {formatJoinDate(user.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono-admin uppercase tracking-wider text-white/35">Account Type</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-white/80">
              <User className="h-3.5 w-3.5 text-white/30" />
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>

        <section>
          <SectionHeading>Emergency Contacts</SectionHeading>
          <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-white/35 italic">
            No contacts synced — data pending from Flutter mobile app
          </p>
        </section>

        <section>
          <SectionHeading>SOS History</SectionHeading>
          <ul className="space-y-2">
            <li className="rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 text-sm text-white/65">
              <span className="font-mono-admin text-[10px] text-white/35">2025-05-12</span>
              <p className="mt-0.5">SOS-2810 — Resolved</p>
            </li>
          </ul>
        </section>

        <section>
          <SectionHeading>Permissions</SectionHeading>
          <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3 text-xs leading-relaxed text-white/45">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
            <p>
              Role-based access is enforced server-side. Changes to role or status take effect on next
              session refresh.
            </p>
          </div>
        </section>
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/5 px-6 py-4">
        <button type="button" className="admin-btn-ghost w-full text-left text-sm">
          Reset Password
        </button>
        {user.status === "active" && (
          <button
            type="button"
            onClick={onDeactivate}
            className="admin-btn-ghost w-full text-left text-sm text-orange-400/90"
          >
            Deactivate Account
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="admin-btn-ghost w-full text-left text-sm text-[#C0392B]/90"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
