"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import SosDetailPanel from "@/components/admin/SosDetailPanel"
import { mapAdminSosEventToAlert, mapLiveEmergencyToAlert } from "@/lib/admin/sos-mappers"
import { fetchLiveEmergencies } from "@/lib/api/admin-live"
import { fetchAdminSosEventDetails } from "@/lib/api/admin-sos"
import type { AdminSosAlert } from "@/lib/admin/sos-types"

export default function SosDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [alert, setAlert] = useState<AdminSosAlert | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const [liveResult, detailResult] = await Promise.all([
        fetchLiveEmergencies(),
        fetchAdminSosEventDetails(id),
      ])

      if (cancelled) return

      const liveMatch = liveResult.data?.data.find((event) => event.id === id)
      if (liveMatch) {
        setAlert(mapLiveEmergencyToAlert(liveMatch))
        setMissing(false)
        setLoading(false)
        return
      }

      if (detailResult.data) {
        setAlert(mapAdminSosEventToAlert(detailResult.data))
        setMissing(false)
        setLoading(false)
        return
      }

      setMissing(true)
      setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (!loading && missing) notFound()

  return (
    <PageTransition>
      <Link
        href="/admin/sos"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Alert Centre
      </Link>
      <h1 className="mb-6 font-display text-[28px] italic text-white">
        Alert {id.slice(0, 8)}
      </h1>
      <div className="max-w-2xl">
        {loading ? (
          <div className="flex min-h-[480px] items-center justify-center rounded-xl border border-white/5 bg-[#0A0A0A]">
            <Loader2 className="h-8 w-8 animate-spin text-white/20" />
          </div>
        ) : (
          <SosDetailPanel alert={alert} />
        )}
      </div>
    </PageTransition>
  )
}
