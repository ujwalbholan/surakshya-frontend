"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast from "react-hot-toast"
import { Eye, Pencil, Trash2, Search, Plus } from "lucide-react"
import PageTransition from "@/components/admin/PageTransition"
import { RoleBadge } from "@/components/admin/Badges"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchUsers } from "@/lib/api/admin-auth"
import {
  MOCK_USERS,
  getInitials,
  type MockUser,
  type UserRole,
  type UserStatus,
} from "@/lib/admin/mock-data"

const ROLES: (UserRole | "ALL")[] = ["ALL", "USER", "GUARDIAN", "POLICE", "ADMIN", "SUPER_ADMIN"]
const STATUSES: (UserStatus | "all")[] = ["all", "active", "inactive"]
const PAGE_SIZE = 10

export default function UserTable() {
  const [users, setUsers] = useState<MockUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [viewUser, setViewUser] = useState<MockUser | null>(null)
  const [editUser, setEditUser] = useState<MockUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<MockUser | null>(null)

  useEffect(() => {
    fetchUsers().then(({ data }) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setUsers(data.map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          role: u.role as UserRole,
          createdAt: new Date().toISOString().split("T")[0],
          status: "active" as UserStatus,
        })))
      } else {
        setUsers(MOCK_USERS)
      }
      setLoading(false)
    })
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)
    const matchRole = roleFilter === "ALL" || u.role === roleFilter
    const matchStatus = statusFilter === "all" || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalMock = 47

  const handleDelete = () => {
    if (!deleteUser) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
    toast.success(`${deleteUser.full_name} deleted`)
    setDeleteUser(null)
  }

  const handleEditSave = () => {
    toast.success("User updated")
    setEditUser(null)
  }

  return (
    <TooltipProvider>
      <PageTransition>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-[28px] italic text-white">User Management</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search name, email, phone..."
                className="admin-input pl-9 w-64"
              />
            </div>
            <Link href="/admin/users/new" className="admin-btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-mono-admin uppercase transition ${roleFilter === r ? "bg-[#C0392B] text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
            >
              {r}
            </button>
          ))}
          <span className="mx-2 w-px bg-white/10" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs capitalize transition ${statusFilter === s ? "bg-white/20 text-white" : "bg-white/5 text-white/50 hover:text-white"}`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
        </div>

        <div className="admin-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left font-mono-admin text-[10px] tracking-wider text-white/40 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full bg-white/5" /></td>
                        ))}
                      </tr>
                    ))
                  : paginated.length === 0
                    ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center">
                            <p className="font-display text-lg italic text-white/50">No users found</p>
                            <Link href="/admin/users/new" className="mt-2 inline-block text-sm text-[#C0392B]">Add a user →</Link>
                          </td>
                        </tr>
                      )
                    : paginated.map((u, i) => (
                        <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/5">
                          <td className="px-4 py-3 font-mono-admin text-xs text-white/40">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          <td className="px-4 py-3 text-white">{u.full_name}</td>
                          <td className="px-4 py-3 text-white/70">{u.email}</td>
                          <td className="px-4 py-3 font-mono-admin text-xs text-white/60">{u.phone}</td>
                          <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                          <td className="px-4 py-3 text-white/50">{u.createdAt}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs capitalize ${u.status === "active" ? "text-emerald-400" : "text-white/40"}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {[
                                { icon: Eye, action: () => setViewUser(u), label: "View" },
                                { icon: Pencil, action: () => setEditUser(u), label: "Edit" },
                                { icon: Trash2, action: () => setDeleteUser(u), label: "Delete" },
                              ].map(({ icon: Icon, action, label }) => (
                                <Tooltip key={label}>
                                  <TooltipTrigger asChild>
                                    <button onClick={action} className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-white">
                                      <Icon className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{label}</TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
            <p className="text-xs text-white/50">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalMock)} of {totalMock} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="admin-btn-ghost px-3 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* View Sheet */}
        <Sheet open={!!viewUser} onOpenChange={() => setViewUser(null)}>
          <SheetContent className="w-full border-white/10 bg-[#0A0A0A] text-white sm:max-w-[480px] overflow-y-auto">
            {viewUser && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-white">User Profile</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C0392B]/20 text-lg font-medium text-[#C0392B]">
                      {getInitials(viewUser.full_name)}
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{viewUser.full_name}</p>
                      <RoleBadge role={viewUser.role} />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-white/50">Email:</span> {viewUser.email}</p>
                    <p><span className="text-white/50">Phone:</span> {viewUser.phone}</p>
                    <p><span className="text-white/50">Joined:</span> {viewUser.createdAt}</p>
                    <p><span className="text-white/50">ID:</span> <span className="font-mono-admin text-xs">{viewUser.id}</span></p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-mono-admin uppercase tracking-wider text-white/40">Emergency Contacts</h3>
                    <p className="text-sm text-white/50 italic">No data — Flutter app sync pending</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-mono-admin uppercase tracking-wider text-white/40">SOS History</h3>
                    <ul className="space-y-1 text-sm text-white/60">
                      <li>2025-05-12 — SOS-2810 (Resolved)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-admin uppercase tracking-wider text-white/40">Account Actions</h3>
                    <button className="admin-btn-ghost w-full text-left">Reset Password</button>
                    <button className="admin-btn-ghost w-full text-left text-orange-400">Deactivate Account</button>
                    <button onClick={() => { setViewUser(null); setDeleteUser(viewUser) }} className="admin-btn-ghost w-full text-left text-[#C0392B]">Delete Account</button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="border-white/10 bg-[#0A0A0A] text-white">
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            {editUser && (
              <div className="space-y-3">
                <div><Label>Full Name</Label><Input defaultValue={editUser.full_name} className="admin-input mt-1" /></div>
                <div><Label>Email</Label><Input defaultValue={editUser.email} className="admin-input mt-1" /></div>
                <div><Label>Phone</Label><Input defaultValue={editUser.phone} className="admin-input mt-1" /></div>
                <div>
                  <Label>Role</Label>
                  <Select defaultValue={editUser.role}>
                    <SelectTrigger className="admin-input mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#0A0A0A]">
                      {ROLES.filter((r) => r !== "ALL").map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button onClick={handleEditSave} className="bg-[#C0392B] hover:bg-[#E74C3C]">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent className="border-white/10 bg-[#0A0A0A] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-white/60">
                Are you sure you want to delete {deleteUser?.full_name}? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-[#C0392B] hover:bg-[#E74C3C]">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </TooltipProvider>
  )
}
