"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Eye, Pencil, Plus, Search, Trash2, UserCheck, UserCog, Users } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import StatCard from "@/components/admin/StatCard"
import UserProfilePanel from "@/components/admin/UserProfilePanel"
import { RoleBadge, UserStatusBadge } from "@/components/admin/Badges"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { fetchUsers } from "@/lib/api/admin-auth"
import { clearAdminSession } from "@/lib/auth/admin-session"
import {
  filterUsers,
  formatJoinDate,
  getUserSummary,
  USER_ROLES,
  USER_STATUSES,
  type UserRoleFilter,
  type UserStatusFilter,
} from "@/lib/admin/users-data"
import { getInitials } from "@/lib/admin/constants"
import type { MockUser, UserRole, UserStatus } from "@/lib/admin/domain-types"

const PAGE_SIZE = 10
const EDITABLE_ROLES: UserRole[] = ["USER", "GUARDIAN", "POLICE", "ADMIN", "SUPER_ADMIN"]

export default function UsersDashboard() {
  const [users, setUsers] = useState<MockUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all")
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState<MockUser | null>(null)
  const [editUser, setEditUser] = useState<MockUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<MockUser | null>(null)

  useEffect(() => {
    fetchUsers({ limit: 100 }).then(({ data, error, status }) => {
      if (status === 401) {
        clearAdminSession()
        setLoadError("Your session expired. Please log in again.")
        toast.error("Session expired — please log in again")
        setUsers([])
      } else if (error) {
        setLoadError(error)
        toast.error(error)
        setUsers([])
      } else if (data?.data) {
        setUsers(
          data.data.map((u) => ({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            phone: u.phone,
            role: u.role as UserRole,
            createdAt: u.created_at?.split("T")[0] ?? "",
            status: (u.is_active ? "active" : "inactive") as UserStatus,
          }))
        )
        setLoadError(null)
      } else {
        setUsers([])
        setLoadError(null)
      }
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(
    () => filterUsers(users, search, roleFilter, statusFilter),
    [users, search, roleFilter, statusFilter]
  )

  const summary = useMemo(() => getUserSummary(users), [users])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  const activeViewUser = viewUser ? users.find((u) => u.id === viewUser.id) ?? viewUser : null

  const handleDelete = () => {
    if (!deleteUser) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
    toast.success(`${deleteUser.full_name} deleted`)
    setDeleteUser(null)
    setViewUser(null)
  }

  const handleDeactivate = (user: MockUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "inactive" as UserStatus } : u))
    )
    toast.success(`${user.full_name} deactivated`)
  }

  const handleEditSave = () => {
    toast.success("User updated")
    setEditUser(null)
  }

  return (
    <TooltipProvider>
      <PageTransition>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[28px] italic text-white">User Management</h1>
            <p className="mt-1 text-sm text-white/40">
              Platform accounts, roles, and access control across the Suraksha network
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search name, email, phone..."
                className="admin-input w-64 pl-9 text-sm"
              />
            </div>
            <Link href="/admin/users/new" className="admin-btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={summary.total} icon={Users} animate={false} />
          <StatCard label="Active" value={summary.active} icon={UserCheck} animate={false} />
          <StatCard label="Staff Accounts" value={summary.staff} icon={UserCog} animate={false} />
          <StatCard label="App Users" value={summary.appUsers} icon={Users} animate={false} />
        </div>

        <div className="admin-card overflow-hidden p-0">
          <div className="space-y-3 border-b border-white/5 px-5 py-4">
            <div className="inline-flex flex-wrap rounded-lg border border-white/10 bg-black/40 p-0.5">
              {USER_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setRoleFilter(role)
                    setPage(1)
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono-admin text-[10px] tracking-wide uppercase transition",
                    roleFilter === role
                      ? "bg-[#C0392B] text-white"
                      : "text-white/45 hover:text-white/75"
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-0.5">
              {USER_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status)
                    setPage(1)
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition",
                    statusFilter === status
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:text-white/75"
                  )}
                >
                  {status === "all" ? "All Status" : status}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/30">
              {filtered.length} user{filtered.length === 1 ? "" : "s"} matching filters
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                  {["#", "User", "Email", "Phone", "Role", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <Skeleton className="h-4 w-full bg-white/5" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Users className="mx-auto h-8 w-8 text-white/10" />
                      <p className="mt-3 font-display text-lg italic text-white/35">
                        {loadError ?? "No users found"}
                      </p>
                      {loadError ? (
                        <Link href="/admin/login" className="mt-2 inline-block text-sm text-white/50 hover:text-white">
                          Log in again →
                        </Link>
                      ) : (
                        <Link href="/admin/users/new" className="mt-2 inline-block text-sm text-white/50 hover:text-white">
                          Add a user →
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginated.map((user, i) => (
                    <tr
                      key={user.id}
                      className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.02]"
                      onClick={() => setViewUser(user)}
                    >
                      <td className="px-5 py-3.5 font-mono-admin text-xs text-white/35">
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-medium text-white/70">
                            {getInitials(user.full_name)}
                          </div>
                          <span className="font-medium text-white">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white/65">{user.email}</td>
                      <td className="px-5 py-3.5 font-mono-admin text-xs text-white/55">{user.phone}</td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-3.5 text-white/45">{formatJoinDate(user.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {[
                            { icon: Eye, action: () => setViewUser(user), label: "View profile" },
                            { icon: Pencil, action: () => setEditUser(user), label: "Edit user" },
                            { icon: Trash2, action: () => setDeleteUser(user), label: "Delete user" },
                          ].map(({ icon: Icon, action, label }) => (
                            <Tooltip key={label}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={action}
                                  className="rounded-md p-1.5 text-white/35 transition hover:bg-white/5 hover:text-white"
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{label}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <p className="text-xs text-white/45">
              Showing {rangeStart}–{rangeEnd} of {filtered.length} users
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono-admin text-[10px] text-white/30">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <Sheet open={!!activeViewUser} onOpenChange={() => setViewUser(null)}>
          <SheetContent className="flex h-full w-full flex-col gap-0 border-white/10 bg-[#0A0A0A] p-0 text-white sm:max-w-[480px]">
            {activeViewUser && (
              <UserProfilePanel
                user={activeViewUser}
                onDeactivate={() => handleDeactivate(activeViewUser)}
                onDelete={() => {
                  setViewUser(null)
                  setDeleteUser(activeViewUser)
                }}
              />
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="border-white/10 bg-[#0A0A0A] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            {editUser && (
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input defaultValue={editUser.full_name} className="admin-input mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input defaultValue={editUser.email} className="admin-input mt-1" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input defaultValue={editUser.phone} className="admin-input mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select defaultValue={editUser.role}>
                    <SelectTrigger className="admin-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0A0A0A]">
                      {EDITABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <button type="button" onClick={() => setEditUser(null)} className="admin-btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleEditSave} className="admin-btn-primary">
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-white/55">
                Are you sure you want to delete {deleteUser?.full_name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-[#C0392B] text-white hover:bg-[#E74C3C]"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </TooltipProvider>
  )
}
