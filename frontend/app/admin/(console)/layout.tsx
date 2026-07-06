"use client"

import { Toaster } from "react-hot-toast"
import AdminAuthGuard from "@/components/admin/AdminAuthGuard"
import Sidebar from "@/components/admin/Sidebar"
import TopHeader from "@/components/admin/TopHeader"
import { useTokenRefresh } from "@/lib/auth/token-refresh"

function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useTokenRefresh()
  return <>{children}</>
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <TokenRefreshProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0A0A0A",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
            success: { iconTheme: { primary: "#ffffff", secondary: "#000" } },
            error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }}
        />
        <div className="flex min-h-screen bg-black">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden pt-14 lg:pt-0 lg:pl-[3.05rem]">
            <TopHeader />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </TokenRefreshProvider>
    </AdminAuthGuard>
  )
}
