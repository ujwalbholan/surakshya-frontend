import type { Metadata } from "next"
import SignupPage from "@/components/auth/SignupPage"

export const metadata: Metadata = {
  title: "Sign Up | Suraksha",
  description:
    "Create your Suraksha account to manage wearable safety settings, trusted contacts, and emergency workflows.",
}

export default function Page() {
  return <SignupPage />
}
