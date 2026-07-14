import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import React from "react";

export const metadata = {
  title: "Admin Panel - Bus Schedule Management",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/?auth=required&from=/dashboard");
  }

  if (user.role !== "admin") {
    if (user.role === "operator") {
      redirect("/operator-dashboard");
    }
    redirect("/?auth=denied");
  }

  return (
    <>
      <main className="flex-1 print:pt-0">{children}</main>
    </>
  );
}
