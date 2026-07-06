import { redirect } from "next/navigation";
import BuyTicketPage from "@/components/home/buy-ticket-page";
import { getUser } from "@/lib/auth/getUser";

export default async function Home() {
  const user = await getUser();

  if (user?.role === "admin") {
    redirect("/dashboard");
  }

  return <BuyTicketPage isAuthenticated={!!user} />;
}
