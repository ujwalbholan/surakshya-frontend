"use client"

import { useEffect, useRef, useState } from "react"
import {
  createTrackingSocket,
  subscribeSosEvents,
  type SocketConnectionStatus,
} from "@/lib/api/socket"
import type { PoliceSosEventSummary, SosSocketEvent } from "@/lib/api/types"
import {
  mapSosEventToAlert,
  mergeSosAlertState,
} from "@/lib/dashboard/sos-mappers"
import type { SosAlert } from "@/lib/dashboard/police-types"

function socketPayloadToSummary(payload: SosSocketEvent): PoliceSosEventSummary {
  return {
    id: payload.id,
    deviceId: payload.deviceId,
    userId: payload.userId ?? null,
    imei: payload.deviceImei ?? payload.deviceId,
    label: payload.label ?? null,
    status: payload.status,
    eventType: payload.eventType,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    triggerNotes: payload.triggerNotes ?? null,
    assignedStationId: payload.assignedStationId ?? null,
    assignedStationName: payload.assignedStationName ?? null,
    startedAt: payload.startedAt,
    resolvedAt: payload.resolvedAt ?? null,
    lastLocation: payload.latestPing
      ? {
          latitude: payload.latestPing.latitude,
          longitude: payload.latestPing.longitude,
          recordedAt: payload.latestPing.recordedAt,
        }
      : payload.latitude != null && payload.longitude != null
        ? {
            latitude: payload.latitude,
            longitude: payload.longitude,
            recordedAt: payload.startedAt,
          }
        : null,
  }
}

export function applySosSocketEvent(
  alerts: SosAlert[],
  payload: SosSocketEvent
): SosAlert[] {
  const { eventType, status, id } = payload

  if (
    eventType === "sos_stopped" ||
    eventType === "sos_resolved" ||
    status === "resolved"
  ) {
    return alerts.filter((a) => a.id !== id)
  }

  const summary = socketPayloadToSummary(payload)
  const mapped = mapSosEventToAlert(summary, payload.citizenName ?? undefined)
  const existingIdx = alerts.findIndex((a) => a.id === id)

  if (existingIdx >= 0) {
    const next = [...alerts]
    next[existingIdx] = mergeSosAlertState(alerts[existingIdx], mapped)
    return next
  }

  if (eventType === "sos_started" || status === "active") {
    return [mapped, ...alerts]
  }

  return alerts
}

export function usePoliceSosSocket(
  enabled: boolean,
  onSosEvent: (payload: SosSocketEvent) => void
) {
  const [connectionStatus, setConnectionStatus] =
    useState<SocketConnectionStatus>("disconnected")
  const onSosEventRef = useRef(onSosEvent)
  onSosEventRef.current = onSosEvent

  useEffect(() => {
    if (!enabled) return

    const socket = createTrackingSocket()
    setConnectionStatus("connecting")

    const onConnect = () => setConnectionStatus("connected")
    const onDisconnect = () => setConnectionStatus("disconnected")
    const onConnectError = () => setConnectionStatus("error")

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)

    const unsubscribe = subscribeSosEvents(socket, (payload) => {
      onSosEventRef.current(payload)
    })

    socket.connect()

    return () => {
      unsubscribe()
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onConnectError)
      socket.disconnect()
    }
  }, [enabled])

  return { connectionStatus }
}
