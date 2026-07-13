import { adminApiRequest } from "./client"
import type {
  ApproveStationLinkResponse,
  PendingStationLinksResponse,
  RejectStationLinkResponse,
} from "./types"

export async function fetchPendingStationLinks(params?: {
  page?: number
  limit?: number
}): Promise<{
  data: PendingStationLinksResponse | null
  error: string | null
  status: number
}> {
  const query = new URLSearchParams()
  query.set("page", String(params?.page ?? 1))
  query.set("limit", String(params?.limit ?? 20))

  return adminApiRequest<PendingStationLinksResponse>(
    `/admin/police/pending-links?${query.toString()}`
  )
}

export async function approveStationLink(linkId: string): Promise<{
  data: ApproveStationLinkResponse | null
  error: string | null
  status: number
}> {
  return adminApiRequest<ApproveStationLinkResponse>(
    `/admin/police/pending-links/${linkId}/approve`,
    { method: "POST" }
  )
}

export async function rejectStationLink(
  linkId: string,
  reason: string
): Promise<{
  data: RejectStationLinkResponse | null
  error: string | null
  status: number
}> {
  return adminApiRequest<RejectStationLinkResponse>(
    `/admin/police/pending-links/${linkId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  )
}
