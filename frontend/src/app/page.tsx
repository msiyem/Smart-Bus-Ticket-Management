import BuyTicketPage from "@/components/home/buy-ticket-page";
import { getUser } from "@/lib/auth/getUser";

export default async function Home() {
  const user = await getUser();

  return <BuyTicketPage isAuthenticated={!!user} />;
}
