"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import RoleSidebar from "./role-sidebar";

/**
 * Returns the current responsive breakpoint deterministically.
 *
 * - "mobile" : < 768px  (Tailwind `md`)  — sidebar should render as a sheet
 * - "md"     : 768–1023px                 — sidebar default = icon-only (collapsed)
 * - "lg"     : >= 1024px                  — sidebar default = fully expanded
 *
 * On the server / first render we cannot read `window`, so we assume the
 * largest breakpoint (`lg`) and let the post-mount effect correct the state
 * if the user is actually on a smaller screen. This avoids the
 * "undefined → boolean" double render that `useIsMobile` introduces and
 * keeps `defaultOpen` always defined.
 */
type Breakpoint = "mobile" | "md" | "lg";

function getBreakpoint(): Breakpoint {
  if (typeof window === "undefined") return "lg";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "md";
  return "lg";
}

export default function SidebarLayout({
  children,
  nav,
  role,
}: {
  children: React.ReactNode;
 
  nav: React.ReactNode;
  role: "admin" | "operator";
}) {
 
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("lg");

  React.useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  
  const defaultOpen = breakpoint !== "md" && breakpoint !== "mobile";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <RoleSidebar role={role} />

      <SidebarInset>
        {nav}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}