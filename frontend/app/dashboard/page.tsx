import AuthGuard from "@/components/auth/AuthGuard"
import PoliceDashboard from "@/components/dashboard/PoliceDashboard"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <PoliceDashboard />
    </AuthGuard>
  )
}
