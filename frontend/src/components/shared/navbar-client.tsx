"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import ticketDark from "../../../public/ticket-mama-dark-new.png";
import ticketLight from "../../../public/ticket-mama-light-new.png";
import maleAvatar from "../../../public/male-avater.png";
import femaleAvatar from "../../../public/female-avater.png";

import { ModeToggle } from "./mode-toggle";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { ChevronDown, Menu, Settings, User, UserRound } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useUserStore } from "@/store/userStore";
import { clientLogout } from "@/lib/auth/client";
import { SidebarTrigger } from "../ui/sidebar";
import {
  parseUserInfoCookieValue,
  type UserInfo,
} from "@/lib/auth/userInfo";

type AuthUser = UserInfo & {
  gender?: "male" | "female" | "other";
};

/**
 * Read the non-HttpOnly `userInfo` companion cookie from the browser.
 *
 * Why this exists:
 *   The HttpOnly `accessToken` cookie is the source of truth and is
 *   read by the server in `getUser()`. But after a client-side login
 *   the navbar prop might briefly be null (when the SSR render hasn't
 *   picked up the new cookies yet, or when the navbar re-mounts on a
 *   soft navigation). The non-HttpOnly `userInfo` companion cookie is
 *   set during /api/auth/login and stays in sync with the access token
 *   — so it lets the navbar render user details instantly on the
 *   client side without waiting for a server round-trip.
 *
 *   This is a fallback for fast UI hydration only — the server-side
 *   `getUser()` remains authoritative for authorization.
 */
function readUserInfoFromBrowser(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("userInfo="));
  if (!match) return null;
  const raw = decodeURIComponent(match.slice("userInfo=".length));
  const info = parseUserInfoCookieValue(raw);
  return info as AuthUser | null;
}

export default function NavbarClient({
  user,
  hasSidebar = false,
}: {
  user: AuthUser | null;
  hasSidebar?: boolean;
}) {
  const router = useRouter();
  const openLogin = useAuthModalStore((state) => state.openLogin);
  const clearUser = useUserStore((state) => state.clearUser);
  const storeUser = useUserStore((state) => state.user);

  // Fallback: if the SSR prop is null but the browser still has the
  // userInfo companion cookie, hydrate from there. This runs once on
  // mount and disappears once the SSR prop catches up.
  const [cookieUser, setCookieUser] = React.useState<AuthUser | null>(null);
  React.useEffect(() => {
    if (user) return;
    const fallback = readUserInfoFromBrowser();
    if (fallback) setCookieUser(fallback);
  }, [user]);

  const zustandUser: AuthUser | null = storeUser
    ? {
        userId: String(storeUser.id ?? ""),
        role: storeUser.role,
        email: storeUser.email,
        name: storeUser.name ?? undefined,
        username: storeUser.username ?? undefined,
      }
    : null;

  const effectiveUser: AuthUser | null =
    user ?? zustandUser ?? cookieUser;


  const isLoggedIn = !!effectiveUser;

  // const getUserInitials = () => {
  //   if (!user?.name) return "U";

  //   return user.name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  //     .slice(0, 2);
  // };

  return (
    <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-emerald-50/90 dark:bg-emerald-800/70 backdrop-blur-md px-4">

      <div className="flex items-center gap-4 relative">
        {hasSidebar && (
        <div className = "relative mr-3 md:hidden">
          <div className="z-50 opacity-0 absolute -top-3">
            <SidebarTrigger
            className="  -ml-2 rounded-lg hover:bg-accent hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            aria-label="Open sidebar menu"
          >

            <span className="sr-only">Open sidebar menu</span>
          </SidebarTrigger>
          </div>
          <Menu  className="absolute -top-2 -left-1 w-5 h-5"/>
        </div>
        )}
        
        
        <>
          <Image
            onClick={() => router.push("/")}
            src={ticketLight}
            alt="Ticket Mama Icon"
            width={120}
            height={50}
            className="h-auto w-auto rounded-full cursor-pointer block dark:hidden"
            priority
          />
          <Image
            onClick={() => router.push("/")}
            src={ticketDark}
            alt="Ticket Mama Icon"
            width={120}
            height={50}
            className="h-auto w-auto rounded-full cursor-pointer hidden dark:block"
            priority
          />
        </>
      </div>
      <div className="relative flex gap-2 items-center">
        <ModeToggle />

        {!isLoggedIn ? (
          <Button variant="default" onClick={openLogin}>
            Login
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* <div className="w-8 h-8 bg-[rgb(69,12,88)] rounded-full flex items-center justify-center cursor-pointer">
                <span className="text-white text-sm font-medium">
                  {getUserInitials()}
                </span>
              </div> */}
              {effectiveUser?.name ? (
                <div
                  title={effectiveUser.name}
                  className="flex items-center gap-2 cursor-pointer border border-ring h-10 px-2 rounded-md max-w-33.5"
                >
                  <div className="w-6 h-6 border border-gray-300 rounded-sm relative bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {effectiveUser?.gender === "male" ? (
                      <Image
                        src={maleAvatar}
                        alt="Male Avatar"
                        width={24}
                        height={24}
                        className="object-cover"
                      />
                    ) : effectiveUser?.gender === "female" ? (
                      <Image
                        src={femaleAvatar}
                        alt="Female Avatar"
                        width={24}
                        height={24}
                        className="object-cover"
                      />
                    ) : (
                      <UserRound className="w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  <div className="truncate text-sm font-bold">{effectiveUser.name}</div>

                  <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                </div>
              ) : null}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{effectiveUser?.name || "User"}</DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={async () => {
                  await clientLogout();
                  clearUser();
                  // Hard navigation back to the home page so the layout
                  // re-evaluates the (now empty) auth state cleanly.
                  window.location.href = "/";
                }}
                className="text-destructive"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
