import type { Metadata } from "next"
import { Suspense } from "react"
import GuardianSetupClient from "./GuardianSetupClient"

export const metadata: Metadata = {
  title: "Guardian Account Setup | Surakshya",
  description: "Complete your Surakshya Guardian Portal account setup.",
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GuardianSetupClient />
    </Suspense>
  )
}
