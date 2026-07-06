import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthModalRoot from "@/components/auth/auth-modal-root";
import NavBar from "@/components/shared/navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getUser } from "@/lib/auth/getUser";
import SidebarLayout from "@/components/shared/sidebar-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bus Ticket Booking App",
  description:
    "A bus ticket booking application built with Next.js and Tailwind CSS.",
  icons: {
    icon: { url: "/logo_icon.png", type: "image/png" },
    shortcut: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user: any = await getUser();
  const hasSidebar = user?.role === "admin" || user?.role === "operator";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {hasSidebar ? (
              <SidebarLayout role={user.role} nav={<NavBar hasSidebar />}>
                {children}
              </SidebarLayout>
            ) : (
              <>
                <NavBar />

                <main className="flex-1 print:pt-0">{children}</main>
              </>
            )}
            <div className="print:hidden">
              <AuthModalRoot />
              <Toaster richColors position="top-right" />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
