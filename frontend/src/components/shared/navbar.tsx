import { getUser } from "@/lib/auth/getUser";
import NavbarClient from "./navbar-client";

export default async function NavBar({
  hasSidebar = false,
}: {
  hasSidebar?: boolean;
}) {
  const user = await getUser();

  return <NavbarClient user={user} hasSidebar={hasSidebar} />;
}
