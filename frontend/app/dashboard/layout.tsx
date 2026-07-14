import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Command Centre | Surakshya — Nepal Police",
  description:
    "Nepal Police Surakshya operations dashboard for monitoring SOS alerts and coordinating emergency response.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-[#080808]">
      {children}
    </div>
  )
}
