import { io, type Socket } from "socket.io-client"
import { getAccessToken } from "@/lib/auth/session"
import type { SosSocketEvent } from "./types"

const WS_BASE =
  process.env.NEXT_PUBLIC_SURAKSHYA_WS_URL?.replace(/\/$/, "") ??
  "http://localhost:3000"

export type SocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export function getTrackingSocketUrl(): string {
  return `${WS_BASE}/tracking`
}

export function createTrackingSocket(): Socket {
  const token = getAccessToken()
  return io(getTrackingSocketUrl(), {
    auth: { token: token ?? "" },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    autoConnect: false,
  })
}

export type SosEventHandler = (payload: SosSocketEvent) => void

export function subscribeSosEvents(
  socket: Socket,
  handler: SosEventHandler
): () => void {
  socket.on("sos_event", handler)
  return () => {
    socket.off("sos_event", handler)
  }
}
