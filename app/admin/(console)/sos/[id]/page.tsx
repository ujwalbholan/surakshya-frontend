"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import PageTransition from "@/components/admin/PageTransition"
import SosDetailPanel from "@/components/admin/SosDetailPanel"
import { MOCK_SOS_ALERTS } from "@/lib/admin/mock-data"

export default function SosDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const alert = MOCK_SOS_ALERTS.find((a) => a.id === id)
  if (!alert) notFound()

  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">Alert {id}</h1>
      <SosDetailPanel alert={alert} />
    </PageTransition>
  )
}
