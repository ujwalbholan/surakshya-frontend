import { adminApiRequest } from "./client"
import type {
  CreatePoliceStationPayload,
  PoliceStation,
  PoliceStationsResponse,
} from "./types"

export async function fetchPoliceStations(): Promise<{
  stations: PoliceStation[]
  error: string | null
}> {
  const { data, error } = await adminApiRequest<PoliceStationsResponse>(
    "/admin/police-stations"
  )
  if (error || !data) {
    return { stations: [], error: error ?? "Failed to load stations" }
  }
  return { stations: data.stations, error: null }
}

export async function createPoliceStation(
  payload: CreatePoliceStationPayload
): Promise<{ station: PoliceStation | null; error: string | null; status: number }> {
  const { data, error, status } = await adminApiRequest<{
    message: string
    station: PoliceStation
  }>("/admin/police-stations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  if (error || !data) {
    return { station: null, error: error ?? "Failed to create station", status }
  }
  return { station: data.station, error: null, status }
}
