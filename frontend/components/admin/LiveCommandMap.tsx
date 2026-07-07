"use client"

import { Fragment, useEffect } from "react"
import Link from "next/link"
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Clock, MapPin, Navigation } from "lucide-react"
import { PriorityBadge, StatusBadge } from "@/components/admin/Badges"
import { createVictimMarkerIcon, GPS_ACCURACY_METERS } from "@/lib/admin/map-markers"
import {
  DARK_MAP_ATTRIBUTION,
  DARK_MAP_TILES,
  NEPAL_MAP_CENTER,
  priorityMarkerColor,
} from "@/lib/admin/live-data"
import type { AdminSosAlert } from "@/lib/admin/sos-types"

interface LiveCommandMapProps {
  alerts: AdminSosAlert[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function FitBounds({ alerts }: { alerts: AdminSosAlert[] }) {
  const map = useMap()

  useEffect(() => {
    if (alerts.length === 0) {
      map.setView([NEPAL_MAP_CENTER.lat, NEPAL_MAP_CENTER.lng], NEPAL_MAP_CENTER.zoom)
      return
    }
    if (alerts.length === 1) {
      map.setView([alerts[0].lat, alerts[0].lng], 13)
      return
    }
    const bounds = L.latLngBounds(alerts.map((a) => [a.lat, a.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 10 })
  }, [alerts, map])

  return null
}

function FlyToSelected({
  alerts,
  selectedId,
}: {
  alerts: AdminSosAlert[]
  selectedId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedId) return
    const alert = alerts.find((a) => a.id === selectedId)
    if (!alert) return
    map.flyTo([alert.lat, alert.lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
  }, [selectedId, alerts, map])

  return null
}

export default function LiveCommandMap({ alerts, selectedId, onSelect }: LiveCommandMapProps) {
  const selected = alerts.find((a) => a.id === selectedId) ?? null

  return (
    <div className="live-command-map relative h-full min-h-[420px] w-full overflow-hidden rounded-lg">
      <MapContainer
        center={[NEPAL_MAP_CENTER.lat, NEPAL_MAP_CENTER.lng]}
        zoom={NEPAL_MAP_CENTER.zoom}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl
      >
        <TileLayer attribution={DARK_MAP_ATTRIBUTION} url={DARK_MAP_TILES} />
        <FitBounds alerts={alerts} />
        <FlyToSelected alerts={alerts} selectedId={selectedId} />

        {alerts.map((alert) => {
          const color = priorityMarkerColor(alert.priority)
          const isSelected = selectedId === alert.id
          const position: [number, number] = [alert.lat, alert.lng]

          return (
            <Fragment key={alert.id}>
              <Circle
                center={position}
                radius={GPS_ACCURACY_METERS}
                pathOptions={{
                  color: isSelected ? "#ffffff" : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.14 : 0.08,
                  weight: isSelected ? 1.5 : 1,
                  dashArray: "6 4",
                }}
              />

              <CircleMarker
                center={position}
                radius={isSelected ? 4 : 3}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: color,
                  fillOpacity: 1,
                  weight: 2,
                }}
              />

              <Marker
                position={position}
                icon={createVictimMarkerIcon(alert, isSelected)}
                zIndexOffset={isSelected ? 1000 : alert.priority === "CRITICAL" ? 500 : 0}
                eventHandlers={{
                  click: () => onSelect(alert.id),
                }}
              >
                {isSelected && (
                  <Tooltip permanent direction="top" offset={[0, -76]} className="live-victim-tooltip">
                    <div className="space-y-0.5 text-center">
                      <p className="font-medium">{alert.victim}</p>
                      <p className="text-[10px] opacity-80">{alert.location}</p>
                    </div>
                  </Tooltip>
                )}

                <Popup className="live-map-popup" closeButton>
                  <div className="space-y-2.5 p-0.5">
                    <div>
                      <p className="font-medium text-white">{alert.victim}</p>
                      <p className="mt-0.5 text-xs text-white/55">{alert.location}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <PriorityBadge priority={alert.priority} />
                      <StatusBadge status={alert.status} />
                    </div>
                    <div className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[10px] text-white/55">
                      <p className="font-mono-admin text-white/70">{alert.id}</p>
                      <p className="mt-1">
                        {alert.lat.toFixed(5)}°N · {alert.lng.toFixed(5)}°E
                      </p>
                      <p className="mt-1">±{GPS_ACCURACY_METERS}m GPS accuracy</p>
                      <p className="mt-1">{alert.address}</p>
                    </div>
                    <Link
                      href={`/admin/sos/${alert.id}`}
                      className="inline-block text-xs text-white/60 transition hover:text-white"
                    >
                      Open victim profile →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          )
        })}
      </MapContainer>

      <div className="pointer-events-none absolute top-3 left-3 z-[1000] rounded-lg border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-sm">
        <p className="font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">Victim Locations</p>
        <p className="mt-0.5 text-sm text-white/80">{alerts.length} persons tracked</p>
      </div>

      <div className="pointer-events-none absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/75 px-3 py-2 backdrop-blur-sm">
        {[
          { label: "Critical", color: "#C0392B" },
          { label: "High", color: "#f97316" },
          { label: "Medium", color: "#eab308" },
          { label: "Low", color: "#737373" },
        ].map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2 text-[10px] text-white/55">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
        <span className="mt-1 border-t border-white/10 pt-1.5 text-[10px] text-white/35">
          Dashed ring = GPS accuracy
        </span>
      </div>

      {selected && (
        <div className="pointer-events-auto absolute right-3 bottom-3 left-3 z-[1000] rounded-lg border border-white/10 bg-black/85 p-3 backdrop-blur-md sm:left-3 sm:max-w-sm">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: priorityMarkerColor(selected.priority) }}
            >
              {selected.victim
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono-admin tracking-wider text-white/40 uppercase">Live Victim Location</p>
              <p className="mt-0.5 font-medium text-white">{selected.victim}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/55">
                <MapPin className="h-3 w-3 shrink-0" />
                {selected.location}
              </p>
              <p className="mt-1 flex items-center gap-1 font-mono-admin text-[10px] text-white/45">
                <Navigation className="h-3 w-3 shrink-0" />
                {selected.lat.toFixed(5)}°N · {selected.lng.toFixed(5)}°E
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-white/35">
                <Clock className="h-3 w-3 shrink-0" />
                GPS lock · {selected.timeAgo} · ±{GPS_ACCURACY_METERS}m
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
