"use client"

import PageTransition from "@/components/admin/PageTransition"
import { Send } from "lucide-react"

const DISPATCH_LOG = [
  { time: "07:39:05", unit: "Unit 12", case: "SOS-2847", officer: "SI Prakash Adhikari", action: "Acknowledged" },
  { time: "07:28:00", unit: "Unit 7", case: "SOS-2846", officer: "ASI Kamal Rai", action: "Dispatched" },
  { time: "07:22:00", unit: "Unit 10", case: "SOS-2843", officer: "ASI Ramesh Poudel", action: "Dispatched" },
  { time: "07:20:00", unit: "Unit 2", case: "SOS-2844", officer: "ASI Bikash Shrestha", action: "On Scene" },
  { time: "06:38:00", unit: "Unit 7", case: "SOS-2841", officer: "ASI Hari Magar", action: "Arrived" },
  { time: "06:35:00", unit: "Unit 7", case: "SOS-2841", officer: "ASI Hari Magar", action: "Dispatched" },
]

export default function DispatchPage() {
  return (
    <PageTransition>
      <div className="mb-6 flex items-center gap-3">
        <Send className="h-5 w-5 text-[#C0392B]" />
        <h1 className="font-display text-[28px] italic text-white">Dispatch Log</h1>
      </div>
      <div className="admin-card">
        <div className="space-y-0 border-l border-white/10 pl-4">
          {DISPATCH_LOG.map((entry, i) => (
            <div key={i} className="relative pb-6">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[#C0392B]" />
              <p className="font-mono-admin text-[10px] text-white/40">{entry.time}</p>
              <p className="text-sm text-white">
                <span className="font-medium">{entry.unit}</span> — {entry.action}
              </p>
              <p className="text-xs text-white/50">{entry.officer} · {entry.case}</p>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
