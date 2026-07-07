import PoliceAuthGuard from "@/components/auth/PoliceAuthGuard"
import PoliceDashboard from "@/components/dashboard/PoliceDashboard"

export default function DashboardPage() {
  return (
    <PoliceAuthGuard>
      <PoliceDashboard />
    </PoliceAuthGuard>
  )
}
