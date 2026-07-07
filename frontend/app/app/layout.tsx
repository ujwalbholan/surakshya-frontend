import type { Metadata } from "next"
import { Toaster } from "react-hot-toast"
import UserAuthGuard from "@/components/auth/UserAuthGuard"

export const metadata: Metadata = {
  title: "App | Suraksha",
  description: "Your Suraksha citizen portal.",
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserAuthGuard>
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa]">{children}</div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fafafa",
            border: "1px solid #333",
          },
        }}
      />
    </UserAuthGuard>
  )
}
