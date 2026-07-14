import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import React from "react";

export const metadata = {
  title: "Operator Panel - Bus Schedule Management",
};

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/?auth=required&from=/operator-dashboard");
  }

  if (user.role !== "operator") {
    if (user.role === "admin") {
      redirect("/dashboard");
    }
    redirect("/?auth=denied");
  }

  return (
    <>
      <main className="flex-1 print:pt-0">{children}</main>
    </>
  );
}