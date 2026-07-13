import { adminApiRequest } from "./client"
import type {
  InvitePoliceOfficerPayload,
  InvitePoliceOfficerResponse,
} from "./types"

/**
 * Creates a police officer account (temp password email + pending station link).
 * Backend route: POST /admin/police/create (old /invite was removed).
 */
export async function invitePoliceOfficer(
  payload: InvitePoliceOfficerPayload
): Promise<{
  data: InvitePoliceOfficerResponse | null
  error: string | null
  status: number
}> {
  const { data, error, status } = await adminApiRequest<InvitePoliceOfficerResponse>(
    "/admin/police/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
  return { data, error, status }
}
