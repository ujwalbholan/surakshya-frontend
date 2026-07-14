import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Guardian | Surakshya",
  description: "Monitor SOS alerts for your linked wards.",
}

export default function GuardianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">{children}</div>
  )
}
