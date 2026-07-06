import BookingTicketPage from "@/components/booking/booking-ticket-page";
import { getUser } from "@/lib/auth/getUser";

type BookingPageProps = {
  params:
    | {
        id: string;
      }
    | Promise<{
        id: string;
      }>;
};

export default async function Page({ params }: BookingPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const bookingId = Number.parseInt(resolvedParams.id, 10);
  const user:any = await getUser();

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-700 dark:text-slate-300">
          You need to be logged in to view this page.
        </p>
      </div>
    );
  }

  if (!Number.isFinite(bookingId) || bookingId <= 0) {
    return <BookingTicketPage bookingId={0} user={user} />;
  }

  return <BookingTicketPage bookingId={bookingId} user={user} />;
}
