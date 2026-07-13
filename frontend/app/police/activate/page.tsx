import type { Metadata } from "next"
import PoliceActivateWizard from "@/components/police/PoliceActivateWizard"

export const metadata: Metadata = {
  title: "Activate Police Account | Surakshya",
  description:
    "Change your temporary password and verify your email to activate your Surakshya Police Portal account.",
}

export default function Page() {
  return <PoliceActivateWizard />
}
