"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import SurakshyaShieldLogo from "@/components/admin/SurakshyaShieldLogo"
import { getAdminSession, clearAdminSession } from "@/lib/auth/admin-session"
import { adminLogout } from "@/lib/api/admin-auth"
import { getInitials } from "@/lib/admin/constants"
import { fetchActiveSosCount } from "@/lib/api/admin-live"
import { getVisibleAdminNavGroups, isAdminNavActive } from "@/lib/admin/nav-config"
import { useInterval } from "@/hooks/use-interval"

interface NavLinkProps {
  href: string
  icon: LucideIcon
  label: string
  isCollapsed: boolean
  isActive: boolean
  trailing?: React.ReactNode
}

function SidebarLabel({
  isCollapsed,
  className,
  children,
}: {
  isCollapsed: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 items-center overflow-hidden transition-all duration-200 ease-out",
        isCollapsed
          ? "max-w-0 -translate-x-5 opacity-0"
          : "max-w-[12rem] translate-x-0 opacity-100",
        className
      )}
    >
      {children}
    </span>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
  trailing,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition",
        isActive
          ? "bg-white/8 text-white"
          : "text-white/45 hover:bg-white/5 hover:text-white/80"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <SidebarLabel isCollapsed={isCollapsed} className="flex-1">
        <div className="ml-2 flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-sm font-medium">{label}</p>
          {trailing}
        </div>
      </SidebarLabel>
      {isCollapsed && trailing}
    </Link>
  )
}

export default function AdminSessionSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const session = getAdminSession()
  const [sosCount, setSosCount] = useState(0)

  useInterval(() => {
    void fetchActiveSosCount().then(({ count }) => setSosCount(count))
  }, 30000)

  useEffect(() => {
    void fetchActiveSosCount().then(({ count }) => setSosCount(count))
  }, [])

  const handleLogout = async () => {
    await adminLogout()
    clearAdminSession()
    router.push("/admin/login")
  }

  const initials = session ? getInitials(session.full_name) : "SA"
  const navGroups = getVisibleAdminNavGroups(session?.role)

  return (
    <div
      className="fixed left-0 z-40 hidden h-full shrink-0 overflow-hidden border-r border-white/5 transition-[width] duration-200 ease-out lg:block"
      style={{ width: isCollapsed ? "3.05rem" : "15rem" }}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="relative z-40 flex h-full w-full shrink-0 flex-col bg-[#0A0A0A] text-white/45">
        <ul className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            {/* Header */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-white/5 p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2 text-white/70 hover:bg-white/5 hover:text-white"
                    >
                      <SurakshyaShieldLogo size={16} variant="mono" />
                      <SidebarLabel isCollapsed={isCollapsed} className="w-fit gap-2">
                        <div className="text-left">
                          <p className="text-sm font-medium text-white">Surakshya</p>
                          <p className="text-[10px] text-white/40">Super Admin</p>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/30" />
                      </SidebarLabel>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="border-white/10 bg-[#0A0A0A] text-white"
                  >
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        System Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Nav */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className="flex w-full flex-col gap-1">
                    {navGroups.map((group, groupIndex) => (
                      <div key={group.title}>
                        {groupIndex > 0 && <Separator className="my-2 bg-white/5" />}
                        {group.items.map((item) => {
                          const isActive = isAdminNavActive(pathname, item.href)
                          let trailing: React.ReactNode = null

                          if (item.badge === "live") {
                            trailing = (
                              <span className="admin-live-dot ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
                            )
                          } else if (item.badge === "sos-count") {
                            trailing = (
                              <span className="ml-auto shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono-admin text-[10px] text-white/60">
                                {sosCount ?? "-"}
                              </span>
                            )
                          }

                          return (
                            <NavLink
                              key={item.href}
                              href={item.href}
                              icon={item.icon}
                              label={item.label}
                              isCollapsed={isCollapsed}
                              isActive={isActive}
                              trailing={trailing}
                            />
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="flex flex-col p-2">
                <Link
                  href="/admin/settings"
                  className={cn(
                    "mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition",
                    isAdminNavActive(pathname, "/admin/settings")
                      ? "bg-white/8 text-white"
                      : "text-white/45 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <SidebarLabel isCollapsed={isCollapsed}>
                    <p className="ml-2 text-sm font-medium">Settings</p>
                  </SidebarLabel>
                </Link>

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full">
                    <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/5 hover:text-white/80">
                      <Avatar className="size-4">
                        <AvatarFallback className="border border-white/10 bg-white/5 text-[9px] text-white/70">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <SidebarLabel
                        isCollapsed={isCollapsed}
                        className="w-full gap-2"
                      >
                        <p className="truncate text-sm font-medium text-white">
                          {session?.full_name ?? "Admin"}
                        </p>
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-white/30" />
                      </SidebarLabel>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    sideOffset={5}
                    className="border-white/10 bg-[#0A0A0A] text-white"
                  >
                    <div className="flex flex-row items-center gap-2 p-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="border border-white/10 bg-white/5 text-xs text-white/70">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">
                          {session?.full_name ?? "Admin"}
                        </span>
                        <span className="line-clamp-1 text-xs text-white/40">
                          {session?.email ?? ""}
                        </span>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href="/admin/settings" className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-white/60 focus:text-white"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </ul>
      </div>
    </div>
  )
}
