import { API_BASE_URL } from "./config"
import type { ApiErrorBody } from "./types"

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(message: string, status: number, body: ApiErrorBody = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as ApiError).name === "ApiError" &&
    typeof (value as ApiError).status === "number"
  )
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError(
      "Could not reach the server. Check your connection and try again.",
      0
    )
  }

  const body = await parseJson<T & ApiErrorBody>(response)

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "message" in body && body.message) ||
      response.statusText ||
      "Request failed"
    throw new ApiError(String(message), response.status, body ?? {})
  }

  if (body === null) {
    throw new ApiError("Invalid response from server.", response.status)
  }

  return body
}

export { isApiError }
