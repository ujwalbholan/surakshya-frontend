import { surakshyaPublicRequest } from "./client"
import type { PoliceSetupMessageResponse } from "./types"

export function setPolicePassword(token: string, newPassword: string) {
  return surakshyaPublicRequest<PoliceSetupMessageResponse>("/police/setup/password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  })
}

export function sendPoliceOtp(token: string) {
  return surakshyaPublicRequest<PoliceSetupMessageResponse>("/police/setup/send-otp", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export function verifyPoliceOtp(token: string, otp: string) {
  return surakshyaPublicRequest<PoliceSetupMessageResponse>("/police/setup/verify-otp", {
    method: "POST",
    body: JSON.stringify({ token, otp }),
  })
}
