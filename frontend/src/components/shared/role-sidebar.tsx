"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  BusFront,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Map,
  Route,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import ticketDark from "../../../public/ticket-mama-dark-new.png";
import ticketLight from "../../../public/ticket-mama-light-new.png";
import type { UserRole } from "@/lib/types";

type SidebarItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles allowed to see this entry. */
  roles: UserRole[];
  exact?: boolean;
};

const navItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "operator"],
    exact: true,
  },
  {
    title: "Day Bookings",
    href: "/day-bookings",
    icon: CalendarDays,
    roles: ["admin"],
  },
  {
    title: "Routes",
    href: "/routes",
    icon: Route,
    roles: ["admin", "operator"],
  },
  {
    title: "Buses",
    href: "/buses",
    icon: BusFront,
    roles: ["admin", "operator"],
  },
  {
    title: "Schedules",
    href: "/schedules",
    icon: Map,
    roles: ["admin", "operator"],
  },
  {
    title: "Operators",
    href: "/operators",
    icon: Building2,
    roles: ["admin"],
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
];

export default function RoleSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname() || "/";
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const roleLabel =
    role === "admin" ? "Admin" : role === "operator" ? "Operator" : "User";

  return (
    <Sidebar
      collapsible="icon"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-mobile": "18rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
      className="border-r border-border bg-background transition-colors"
    >
      <SidebarHeader className="border-b border-border h-16  hover:bg-accent/50 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
        {/* <div className="flex items-center relative ">
          <Image
            // onClick={() => router.push("/")}
            src={ticketLight}
            alt="Ticket Mama Icon"
            width={120}
            height={50}
            className="h-auto w-auto rounded-full cursor-pointer block dark:hidden"
            priority
          />
          <Image
            src={ticketDark}
            alt="Ticket Mama Icon"
            width={120}
            height={50}
            className="h-7 w-7 rounded-full hidden dark:block"
            priority
          />
        </div> */}
        <div
          onClick={toggleSidebar}
          className="flex items-center cursor-pointer justify-between px-4 py-1"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              {roleLabel}
            </p>
          </div>

          <SidebarTrigger
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg hover:bg-accent hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-1">
              {visibleItems.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No menu items available for your role.
                </p>
              ) : (
                visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={
                          "h-9 rounded-sm transition-all duration-300 " +
                          (isActive
                            ? " !bg-emerald-600/70 !text-white hover:bg-emerald-700 hover:text-white dark:bg-emerald-500/50 dark:hover:bg-emerald-600/80"
                            : "hover:bg-emerald-100/70 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300")
                        }
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate font-medium">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
