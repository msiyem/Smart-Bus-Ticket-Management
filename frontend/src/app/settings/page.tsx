import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth/getUser";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  return <SettingsClient initialName={user.name || ""} />;
}
