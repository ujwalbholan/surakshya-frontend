import { adminApiRequest } from "./client"
import type {
  InvitePoliceOfficerPayload,
  InvitePoliceOfficerResponse,
} from "./types"

export async function invitePoliceOfficer(
  payload: InvitePoliceOfficerPayload
): Promise<{
  data: InvitePoliceOfficerResponse | null
  error: string | null
  status: number
}> {
  const { data, error, status } = await adminApiRequest<InvitePoliceOfficerResponse>(
    "/admin/police/invite",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
  return { data, error, status }
}
