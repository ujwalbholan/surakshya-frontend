"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import PageTransition from "@/components/admin/PageTransition"
import { clearAdminSession, getAdminSession } from "@/lib/auth/admin-session"
import { checkHealth } from "@/lib/api/admin-auth"
import {
  fetchAdminSettings,
  updateAdminSettings,
  type AdminNotificationsSettings,
} from "@/lib/api/admin-settings"
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
type Tab = (typeof TABS)[number]

const DEFAULT_NOTIFICATIONS: AdminNotificationsSettings = {
  newSos: { email: true, push: true, sms: false },
  sosUnack: { email: true, push: true, sms: true },
  newUser: { email: true, push: false, sms: false },
  caseChange: { email: false, push: true, sms: false },
  systemHealth: { email: true, push: true, sms: false },
}

export default function SettingsPage() {
  const session = getAdminSession()
  const [activeTab, setActiveTab] = useState<Tab>("General")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPurge, setConfirmPurge] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [notifications, setNotifications] =
    useState<AdminNotificationsSettings>(DEFAULT_NOTIFICATIONS)

  const loadSettings = useCallback(() => {
    setLoading(true)
    fetchAdminSettings().then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        return
      }
      if (error || !data) {
        toast.error(error ?? "Failed to load settings")
        setLoading(false)
        return
      }
      const s = data.settings
      setPlatformName(String(s.platform_name ?? "Suraksha"))
      setSupportEmail(String(s.support_email ?? ""))
      setLanguage(String(s.language ?? "English"))
      setSessionTimeout(String(s.session_timeout ?? "30 min"))
      setApiUrl(String(s.api_url ?? ""))
      setApiTimeout(String(s.api_timeout ?? "10s"))
      setNotifications({
        ...DEFAULT_NOTIFICATIONS,
        ...(s.notifications ?? {}),
      })
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const saveGeneral = async () => {
    setSaving(true)
    const { error, status } = await updateAdminSettings({
      platform_name: platformName,
      support_email: supportEmail,
      language,
    })
    setSaving(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Settings saved")
  }

  const saveSecurity = async () => {
    setSaving(true)
    const { error, status } = await updateAdminSettings({
      session_timeout: sessionTimeout,
    })
    setSaving(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Security settings saved")
  }

  const saveNotifications = async () => {
    setSaving(true)
    const { error, status } = await updateAdminSettings({ notifications })
    setSaving(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }
    toast.success("Preferences saved")
  }

  const saveApi = async () => {
    setSaving(true)
    const { error, status } = await updateAdminSettings({
      api_url: apiUrl,
      api_timeout: apiTimeout,
    })
    setSaving(false)
    if (status === 401) {
      clearAdminSession()
      return
    }
    if (error) {
      toast.error(error)
      return
    }
    toast.success("API settings saved")
  }

  const testConnection = async () => {
    setConnectionStatus("idle")
    const { status, error } = await checkHealth()
    setConnectionStatus(status >= 200 && status < 300 && !error ? "connected" : "unreachable")
  }

  const exportUsers = () => {
    const csv = `Name,Email,Role\n${session?.full_name ?? ""},${session?.email ?? ""},${session?.role ?? ""}`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "suraksha-users-export.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("User data exported")
  }

  if (loading) {
    return (
      <PageTransition>
        <h1 className="mb-6 font-display text-[28px] italic text-white">System Settings</h1>
        <p className="text-sm text-white/40">Loading settings…</p>
      </PageTransition>
    )
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
                tab === "Danger Zone" && activeTab === tab && "text-red-400",
              )}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="flex-1 admin-card">
          {activeTab === "General" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">Platform Name</label>
                <input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Support Email</label>
                <input
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Timezone</label>
                <input value="Asia/Kathmandu" disabled className="admin-input opacity-60" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Language</label>
                <div className="flex gap-2">
                  {["English", "Nepali"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm",
                        language === l ? "bg-[#C0392B] text-white" : "bg-white/5 text-white/50",
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={saveGeneral}
                disabled={saving}
                className="admin-btn-primary"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {activeTab === "Profile" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="admin-input"
                />
              </div>
              <hr className="border-white/5" />
              <p className="text-sm font-medium text-white">Change Password</p>
              <div>
                <label className="mb-1 block text-sm text-white/70">Current Password</label>
                <input type="password" className="admin-input" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">New Password</label>
                <input type="password" className="admin-input" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">Confirm New Password</label>
                <input type="password" className="admin-input" />
              </div>
              <button
                onClick={() => toast.error("Profile update via this form is not wired yet")}
                className="admin-btn-primary"
              >
                Update Profile
              </button>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">Session Timeout</label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="admin-input w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0A0A0A]">
                    {["15 min", "30 min", "1 hour", "4 hours"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Two-Factor Authentication</p>
                  <span className="text-xs text-white/40">Coming soon</span>
                </div>
                <Switch disabled />
              </div>
              <button
                onClick={saveSecurity}
                disabled={saving}
                className="admin-btn-primary"
              >
                {saving ? "Saving…" : "Save Security Settings"}
              </button>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-4">
              {(
                [
                  ["newSos", "New SOS Alert", ["email", "push"]],
                  ["sosUnack", "SOS Unacknowledged > 2 min", ["email", "push", "sms"]],
                  ["newUser", "New User Registration", ["email"]],
                  ["caseChange", "Case Status Change", ["push"]],
                  ["systemHealth", "System Health Alert", ["email", "push"]],
                ] as const
              ).map(([key, label, channels]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-white/5 pb-3"
                >
                  <p className="text-sm text-white">{label}</p>
                  <div className="flex gap-3">
                    {channels.map((ch) => (
                      <label
                        key={ch}
                        className="flex items-center gap-1 text-xs capitalize text-white/50"
                      >
                        <input
                          type="checkbox"
                          checked={
                            (notifications[key] as Record<string, boolean> | undefined)?.[
                              ch
                            ] ?? false
                          }
                          onChange={(e) =>
                            setNotifications((prev) => ({
                              ...prev,
                              [key]: {
                                ...(prev[key] ?? {}),
                                [ch]: e.target.checked,
                              },
                            }))
                          }
                          className="accent-[#C0392B]"
                        />
                        {ch}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={saveNotifications}
                disabled={saving}
                className="admin-btn-primary"
              >
                {saving ? "Saving…" : "Save Preferences"}
              </button>
            </div>
          )}

          {activeTab === "API" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/70">AMS Backend URL</label>
                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="admin-input"
                />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={testConnection} className="admin-btn-ghost">
                  Test Connection
                </button>
                {connectionStatus === "connected" && (
                  <span className="text-sm text-emerald-400">Connected</span>
                )}
                {connectionStatus === "unreachable" && (
                  <span className="text-sm text-red-400">Unreachable</span>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/70">API Response Timeout</label>
                <Select value={apiTimeout} onValueChange={setApiTimeout}>
                  <SelectTrigger className="admin-input w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#0A0A0A]">
                    {["5s", "10s", "30s"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button onClick={saveApi} disabled={saving} className="admin-btn-primary">
                {saving ? "Saving…" : "Save API Settings"}
              </button>
            </div>
          )}

          {activeTab === "Danger Zone" && (
            <div className="space-y-4 rounded-lg border border-red-500/30 p-4">
              <button
                onClick={exportUsers}
                className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5"
              >
                Export All User Data
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete All Inactive Users
              </button>
              <button
                onClick={() => setConfirmPurge(true)}
                className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Purge Audit Log
              </button>
              <p className="text-xs text-white/30">
                Destructive actions below are not available yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inactive Users</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action is not available yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="admin-input"
            placeholder="DELETE INACTIVE"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== "DELETE INACTIVE"}
              onClick={() => {
                toast.error("Not available yet")
                setConfirmDelete(false)
                setDeleteConfirmText("")
              }}
              className="bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmPurge} onOpenChange={setConfirmPurge}>
        <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Purge Audit Log?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This action is not available yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.error("Not available yet")
                setConfirmPurge(false)
              }}
              className="bg-red-600"
            >
              Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
