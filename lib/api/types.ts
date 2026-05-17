export interface ApiErrorBody {
  message?: string
  error?: string
  statusCode?: number
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginResponse {
  message: string
  email: string
  token: AuthTokens
}
