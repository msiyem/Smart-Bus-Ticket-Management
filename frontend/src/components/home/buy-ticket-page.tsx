"use client";

import React from "react";
import { useRouter } from "next/navigation";

import SearchFormCover from "../../../public/home-cover.png";
import SearchFormCoverDark from "../../../public/home-cover-dark.png";

import { getMyBookings } from "@/action/booking.action";
import { refreshSession } from "@/action/session.action";
import { BookingToast } from "@/components/buy-ticket/booking-toast";
import { MyTicketsSection } from "@/components/buy-ticket/my-tickets-section";
import { SearchForm } from "@/components/buy-ticket/search-form";
import { useBooking } from "@/hooks/use-booking";
import type { SearchState } from "@/types/booking";
import type { MyBookingsResponse } from "@/types/booking";
import { useAuthModalStore } from "@/store/auth-modal-store";
import Image from "next/image";
import { Dot, Sparkle, Sparkles, Star } from "lucide-react";

export default function BuyTicketPage({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const openLogin = useAuthModalStore((state) => state.openLogin);
  const [authenticated, setAuthenticated] = React.useState(isAuthenticated);


  const ensureAuthenticated = React.useCallback(async () => {
    if (authenticated) {
      return true;
    }

    // Only refresh when we have nothing else to go on.
    // refreshSession() dedupes internally, so even if multiple paths call
    // it concurrently only one backend round-trip happens.
    const refreshed = await refreshSession();

    if (refreshed) {
      setAuthenticated(true);
      return true;
    }

    return false;
  }, [authenticated]);

  const { search, setSearch, swapCities, bookingToast, setBookingToast } =
    useBooking({
      ensureAuthenticated,
      onRequireAuth: openLogin,
    });

  const buildSearchHref = React.useCallback((searchState: SearchState) => {
    const params = new URLSearchParams();

    if (searchState.source) params.set("fromcity", searchState.source);
    if (searchState.destination) params.set("tocity", searchState.destination);
    if (searchState.date) params.set("doj", searchState.date);

    const query = params.toString();

    return query
      ? `/bus-tickets/booking/bus/search?${query}`
      : "/bus-tickets/booking/bus/search";
  }, []);


  return (
    <main
      className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_30%),linear-gradient(180deg,#f7fbf8_0%,#ffffff_42%,#eef3ef_100%)] text-slate-950 
      dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_30%),linear-gradient(180deg,#0a1220_0%,#0f172a_50%,#111827_100%)] dark:text-slate-100"
    >
      

      <section className="relative mx-auto w-full ">
        <BookingToast
          visible={bookingToast.visible}
          bookingId={bookingToast.id}
          onViewTicket={() => {
            if (bookingToast.id) {
              router.push(`/booking/${bookingToast.id}`);
            }
          }}
          onClose={() => setBookingToast({ visible: false, id: null })}
        />

        <section className="relative overflow-visible ">
          {/* Background Image */}
          <div className="relative w-full -mt-2">
            {/* Light Mode Image */}
            <Image
              src={SearchFormCover}
              alt="Bus ticket cover"
              priority
              className="block h-auto w-full dark:hidden"
              sizes="100vw"
            />

            {/* Dark Mode Image */}
            <Image
              src={SearchFormCoverDark}
              alt="Bus ticket cover dark"
              priority
              className="hidden h-auto w-full dark:block"
              sizes="100vw"
            />
            <Sparkle strokeWidth={0.75}  className="absolute left-20 top-10 h-1 w-0.5 sm:h-1 sm:w-1 md:h-2 md:w-1.5 hidden dark:block  animate-pulse " />
            <Sparkle strokeWidth={1}  className="absolute left-1/3 top-15 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Sparkles strokeWidth={1}  className="absolute left-1/2 top-8 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Dot strokeWidth={4}  className="absolute left-1/5 top-8 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Dot strokeWidth={3}  className="absolute left-1/6 top-1/3 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Dot strokeWidth={3}  className="absolute left-1/10 top-1/2 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Dot strokeWidth={4}  className="absolute left-15 top-2/3 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Dot strokeWidth={3}  className="absolute right-40 top-8 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />
            <Star strokeWidth={1}  className="absolute right-23/100 top-1/4 h-0.5 w-0.5 sm:h-0.75 sm:w-0.75 md:h-1 md:w-1 hidden dark:block animate-pulse" />

          </div>

          {/* Search Form Card */}
          <div className="absolute left-1/2 top-full sm:top-[85%] md:top-[65%] lg:top-[60%] z-20 w-full -translate-x-1/2 px-4">
            <div className="mx-auto max-w-6xl rounded-3xl bg-white/30 p-3 shadow backdrop-blur dark:bg-emerald-900/30 lg:p-3.5">
              <SearchForm
                search={search}
                onSearchChange={setSearch}
                onSwapCities={swapCities}
                onSubmitSearch={async () => {
                  router.push(buildSearchHref(search));
                }}
                loadingSearch={false}
                status={null}
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
