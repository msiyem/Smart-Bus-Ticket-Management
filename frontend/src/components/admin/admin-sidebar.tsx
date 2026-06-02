"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import {
  BusFront,
  LayoutDashboard,
  Map,
  Route,
  Users,
  CalendarDays,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Day Bookings", href: "/admin/day-bookings", icon: CalendarDays },
  { title: "Routes", href: "/admin/routes", icon: Route },
  { title: "Buses", href: "/admin/buses", icon: BusFront },
  { title: "Schedules", href: "/admin/schedules", icon: Map },
  { title: "Users", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="top-16 h-[calc(100svh-4rem)] border-r border-sidebar-border/60"
      variant="inset"
      collapsible="icon"
    >
      <SidebarHeader>
        <div className="rounded-xl border border-emerald-200/70 bg-white/70 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
            Admin
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Control panel
          </p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
