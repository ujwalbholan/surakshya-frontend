"use client"

import Image from "next/image"
import { AlertTriangle, Watch, X } from "lucide-react"
import type { SosAlert } from "@/lib/dashboard/police-types"

interface IncomingSosModalProps {
  alert: SosAlert
  onView: () => void
  onDismiss: () => void
}

export default function IncomingSosModal({
  alert,
  onView,
  onDismiss,
}: IncomingSosModalProps) {
  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-labelledby="incoming-sos-title"
        className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-lg border border-[#C0392B] bg-[#111] shadow-[0_0_48px_rgba(192,57,43,0.25)]"
      >
        <div className="flex items-center gap-2 border-b border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C0392B] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#C0392B]" />
          </span>
          <Watch className="h-4 w-4 text-[#C0392B]" />
          <p
            id="incoming-sos-title"
            className="flex-1 text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]"
          >
            Double-tap SOS — immediate response required
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[#666] hover:text-[#FAFAFA]"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-4 p-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-[#333]">
            <Image
              src={alert.victim.photoUrl}
              alt={alert.victim.fullName}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-[#FAFAFA]">{alert.victim.fullName}</p>
            <p className="mt-0.5 text-xs text-[#888]">{alert.location}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#C0392B]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Wristband sensor activated · Live GPS streaming
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[#222] p-4">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded border border-[#333] py-2.5 text-[10px] uppercase tracking-wider text-[#888] hover:border-[#444] hover:text-[#FAFAFA]"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded bg-[#C0392B] py-2.5 text-[10px] font-medium uppercase tracking-wider text-white hover:bg-[#AA1122]"
          >
            View victim profile
          </button>
        </div>
      </div>
    </div>
  )
}
