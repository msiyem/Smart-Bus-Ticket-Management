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

import { ChevronDown, Settings, User, UserRound } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { refreshSession } from "@/action/session.action";
import { logout } from "@/action/auth.action";

type AuthUser = {
  userId: string;
  role: "user" | "admin";
  email: string;
  name?: string;
  phone?: string;
  username?: string;
  gender?: "male" | "female" | "other";
};

export default function NavbarClient({
  user,
  refreshed,
}: {
  user: AuthUser | null;
  refreshed?: boolean;
}) {
  const router = useRouter();
  const openLogin = useAuthModalStore((state) => state.openLogin);

  React.useEffect(() => {
    if (refreshed) {
      const sessionRefresh = async () => {
        await refreshSession();
      };
      sessionRefresh();
    }
  }, [refreshed]);

  const isLoggedIn = !!user;

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
    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-emerald-50/90 dark:bg-emerald-800/70 backdrop-blur-md px-4">
      <div className="flex items-center gap-4 relative">
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
              {user?.name ? (
                <div
                  title={user.name}
                  className="flex items-center gap-2 cursor-pointer border border-ring h-10 px-2 rounded-md max-w-33.5"
                >
                  <div className="w-6 h-6 border border-gray-300 rounded-sm relative bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.gender === "male" ? (
                      <Image
                        src={maleAvatar}
                        alt="Male Avatar"
                        width={24}
                        height={24}
                        className="object-cover"
                      />
                    ) : user?.gender === "female" ? (
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

                  <div className="truncate text-sm font-bold">{user.name}</div>

                  <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />
                </div>
              ) : null}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.name || "User"}</DropdownMenuLabel>

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
                onClick={async () => await logout()}
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
