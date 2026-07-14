"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import Image from "next/image";
import ticketDark from "../../../public/ticket-mama-dark-new.png";
import ticketLight from "../../../public/ticket-mama-light-new.png";
import { useRef } from "react";

const adminNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Day Bookings", href: "/day-bookings", icon: CalendarDays },
  { title: "Routes", href: "/routes", icon: Route },
  { title: "Buses", href: "/buses", icon: BusFront },
  { title: "Schedules", href: "/schedules", icon: Map },
  { title: "Operators", href: "/operators", icon: Building2 },
  { title: "Users", href: "/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-mobile": "18rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
      className="
        border-r
        border-border
        bg-background
        transition-colors
      "
    >
      <SidebarHeader
        className="border-b border-border cursor-pointer hover:bg-accent/50 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
        onClick={() => triggerRef.current?.click()}
      >
        <div className="flex items-center justify-between px-4 py-1 md:mt-14">
          <div className="overflow-hidden">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              Admin
            </p>
          </div>

          <SidebarTrigger
            ref={triggerRef}
            onClick={(e) => e.stopPropagation()}
            className="
        rounded-lg
        hover:bg-accent
        hover:text-emerald-600
        
        dark:hover:text-emerald-400
        transition-all
      "
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`
                        h-9
                        rounded-sm
                        transition-all
                        duration-300

                        ${
                          isActive
                            ? " !bg-emerald-600/70 !text-white hover:bg-emerald-700 hover:text-white dark:bg-emerald-500/50 dark:hover:bg-emerald-600/80"
                            : "hover:bg-emerald-100/70 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                        }
                      `}
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
