"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import PageTransition from "@/components/admin/PageTransition"
import { getAdminSession } from "@/lib/auth/admin-session"
import { checkHealth } from "@/lib/api/admin-auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TABS = ["General", "Profile", "Security", "Notifications", "API", "Danger Zone"] as const
type Tab = typeof TABS[number]

export default function SettingsPage() {
  const session = getAdminSession()
  const [activeTab, setActiveTab] = useState<Tab>("General")
  const [platformName, setPlatformName] = useState("Suraksha")
  const [supportEmail, setSupportEmail] = useState("support@suraksha.com.np")
  const [language, setLanguage] = useState("English")
  const [fullName, setFullName] = useState(session?.full_name ?? "")
  const [email, setEmail] = useState(session?.email ?? "")
  const [phone, setPhone] = useState(session?.phone ?? "")
  const [sessionTimeout, setSessionTimeout] = useState("30 min")
  const [apiUrl, setApiUrl] = useState("https://surakshya.onrender.com")
  const [apiTimeout, setApiTimeout] = useState("10s")
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "unreachable">("idle")
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [notifications, setNotifications] = useState({
    newSos: { email: true, push: true, sms: false },
    sosUnack: { email: true, push: true, sms: true },
    newUser: { email: true, push: false, sms: false },
    caseChange: { email: false, push: true, sms: false },
    systemHealth: { email: true, push: true, sms: false },
  })

  const testConnection = async () => {
    setConnectionStatus("idle")
    const { status, error } = await checkHealth()
    setConnectionStatus(status >= 200 && status < 300 && !error ? "connected" : "unreachable")
  }

  const exportUsers = () => {
    const csv = "Name,Email,Role\nUjwal Bholan,ujwalbholan@gmail.com,SUPER_ADMIN"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "suraksha-users-export.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("User data exported")
  }

  return (
    <PageTransition>
      <h1 className="mb-6 font-display text-[28px] italic text-white">System Settings</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-48 lg:flex-col">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition",
                activeTab === tab ? "bg-[#C0392B]/10 text-[#C0392B]" : "text-white/50 hover:text-white",
                tab === "Danger Zone" && activeTab === tab && "text-red-400"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex-1 admin-card">
          {activeTab === "General" && (
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm text-white/70">Platform Name</label><input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">Support Email</label><input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">Timezone</label><input value="Asia/Kathmandu" disabled className="admin-input opacity-60" /></div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Language</label>
                <div className="flex gap-2">
                  {["English", "Nepali"].map((l) => (
                    <button key={l} onClick={() => setLanguage(l)} className={cn("rounded-lg px-4 py-2 text-sm", language === l ? "bg-[#C0392B] text-white" : "bg-white/5 text-white/50")}>{l}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success("Settings saved")} className="admin-btn-primary">Save Changes</button>
            </div>
          )}

          {activeTab === "Profile" && (
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm text-white/70">Full Name</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-input" /></div>
              <hr className="border-white/5" />
              <p className="text-sm font-medium text-white">Change Password</p>
              <div><label className="mb-1 block text-sm text-white/70">Current Password</label><input type="password" className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">New Password</label><input type="password" className="admin-input" /></div>
              <div><label className="mb-1 block text-sm text-white/70">Confirm New Password</label><input type="password" className="admin-input" /></div>
              <button onClick={() => toast.success("Profile updated")} className="admin-btn-primary">Update Profile</button>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">Session Timeout</label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="admin-input w-48"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0A0A0A]">
                    {["15 min", "30 min", "1 hour", "4 hours"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-white">Two-Factor Authentication</p><span className="text-xs text-white/40">Coming soon</span></div>
                <Switch disabled />
              </div>
              <div>
                <h3 className="mb-2 text-xs font-mono-admin uppercase text-white/40">Active Sessions</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-white/5"><td className="py-2 text-white">Current session</td><td className="py-2 text-emerald-400">Active</td><td></td></tr>
                    <tr className="border-b border-white/5"><td className="py-2 text-white/60">Chrome · Kathmandu</td><td className="py-2 text-white/40">2 hr ago</td><td><button className="text-xs text-[#C0392B]">Revoke</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-4">
              {([
                ["newSos", "New SOS Alert", ["email", "push"]],
                ["sosUnack", "SOS Unacknowledged > 2 min", ["email", "push", "sms"]],
                ["newUser", "New User Registration", ["email"]],
                ["caseChange", "Case Status Change", ["push"]],
                ["systemHealth", "System Health Alert", ["email", "push"]],
              ] as const).map(([key, label, channels]) => (
                <div key={key} className="flex items-center justify-between border-b border-white/5 pb-3">
                  <p className="text-sm text-white">{label}</p>
                  <div className="flex gap-3">
                    {channels.map((ch) => (
                      <label key={ch} className="flex items-center gap-1 text-xs text-white/50 capitalize">
                        <input
                          type="checkbox"
                          checked={(notifications[key as keyof typeof notifications] as Record<string, boolean>)[ch]}
                          onChange={(e) => setNotifications((prev) => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof notifications], [ch]: e.target.checked },
                          }))}
                          className="accent-[#C0392B]"
                        />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => toast.success("Preferences saved")} className="admin-btn-primary">Save Preferences</button>
            </div>
          )}

          {activeTab === "API" && (
            <div className="space-y-4">
              <div><label className="mb-1 block text-sm text-white/70">AMS Backend URL</label><input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="admin-input" /></div>
              <div className="flex items-center gap-3">
                <button onClick={testConnection} className="admin-btn-ghost">Test Connection</button>
                {connectionStatus === "connected" && <span className="text-sm text-emerald-400">Connected</span>}
                {connectionStatus === "unreachable" && <span className="text-sm text-red-400">Unreachable</span>}
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">API Response Timeout</label>
                <Select value={apiTimeout} onValueChange={setApiTimeout}>
                  <SelectTrigger className="admin-input w-32"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0A0A0A]">
                    {["5s", "10s", "30s"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {activeTab === "Danger Zone" && (
            <div className="space-y-4 rounded-lg border border-red-500/30 p-4">
              <button onClick={() => setConfirmReset(true)} className="w-full rounded-lg border border-orange-500/30 px-4 py-2 text-sm text-orange-400 hover:bg-orange-500/10">Reset All Mock Data</button>
              <button onClick={exportUsers} className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5">Export All User Data</button>
              <button onClick={() => setConfirmDelete(true)} className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Delete All Inactive Users</button>
              <button onClick={() => setConfirmPurge(true)} className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Purge Audit Log</button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <AlertDialogHeader><AlertDialogTitle>Reset Mock Data?</AlertDialogTitle><AlertDialogDescription className="text-white/60">This will reset all mock data to defaults.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Mock data reset"); setConfirmReset(false) }} className="bg-orange-600">Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <AlertDialogHeader><AlertDialogTitle>Delete Inactive Users</AlertDialogTitle><AlertDialogDescription className="text-white/60">Type DELETE INACTIVE to confirm.</AlertDialogDescription></AlertDialogHeader>
          <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="admin-input" placeholder="DELETE INACTIVE" />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== "DELETE INACTIVE"}
              onClick={() => { toast.success("Inactive users deleted"); setConfirmDelete(false); setDeleteConfirmText("") }}
              className="bg-red-600"
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <AlertDialogHeader><AlertDialogTitle>Purge Audit Log?</AlertDialogTitle><AlertDialogDescription className="text-white/60">This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { toast.success("Audit log purged"); setConfirmPurge(false) }} className="bg-red-600">Purge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
