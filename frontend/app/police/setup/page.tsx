import type { Metadata } from "next"
import { Suspense } from "react"
import PoliceSetupPage from "./PoliceSetupClient"

export const metadata: Metadata = {
  title: "Police Account Setup | Surakshya",
  description: "Complete your Surakshya Police Portal account setup.",
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PoliceSetupPage />
    </Suspense>
  )
}
