import type { Metadata } from "next"
import LoginPage from "@/components/auth/LoginPage"

export const metadata: Metadata = {
  title: "Login | Suraksha",
  description:
    "Securely log in to your Suraksha account to manage safety settings, emergency contacts, and incident history.",
}

export default function Page() {
  return <LoginPage />
}
