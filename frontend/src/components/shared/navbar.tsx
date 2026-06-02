// components/shared/navbar.tsx

import { getUser } from "@/lib/auth/getUser";
import NavbarClient from "./navbar-client";
import { getCookie } from "@/lib/cookies";

export default async function NavBar() {
  let refreshed = false;
  const user = await getUser();
  const refreshToken = await getCookie("refreshToken");
  const sessionId = await getCookie("sessionId");
  const accessToken = await getCookie("accessToken");
  if (refreshToken && sessionId && !accessToken) {
    refreshed = true;
  }

  return <NavbarClient user={user} refreshed={refreshed} />;
}
