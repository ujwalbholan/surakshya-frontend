import type { Metadata } from "next"
import GuardianActivateWizard from "@/components/guardian/GuardianActivateWizard"

export const metadata: Metadata = {
  title: "Activate Guardian Account | Surakshya",
  description:
    "Change your temporary password and verify your phone to activate your Surakshya Guardian Portal account.",
}

export default function Page() {
  return <GuardianActivateWizard />
}
