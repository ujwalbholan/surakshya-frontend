"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import SosDetailPanel from "@/components/admin/SosDetailPanel"
import { MOCK_SOS_ALERTS } from "@/lib/admin/mock-data"

export default function SosDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const alert = MOCK_SOS_ALERTS.find((a) => a.id === id || a.id.includes(id))
  if (!alert) notFound()

  return (
    <PageTransition>
      <Link
        href="/admin/sos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Alert Centre
      </Link>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Alert {alert.id}</h1>
      <div className="max-w-2xl">
        <SosDetailPanel alert={alert} />
      </div>
    </PageTransition>
  )
}
