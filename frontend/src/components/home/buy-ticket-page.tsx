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

export default function BuyTicketPage({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const openLogin = useAuthModalStore((state) => state.openLogin);
  const [authenticated, setAuthenticated] = React.useState(isAuthenticated);
  const [myTickets, setMyTickets] = React.useState<MyBookingsResponse | null>(
    null,
  );
  const [myTicketsLoading, setMyTicketsLoading] = React.useState(false);
  const [myTicketsError, setMyTicketsError] = React.useState<string | null>(
    null,
  );

  const ensureAuthenticated = React.useCallback(async () => {
    if (authenticated) {
      return true;
    }

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

  const loadMyTickets = React.useCallback(async () => {
    if (!authenticated) {
      setMyTickets(null);
      return;
    }

    setMyTicketsLoading(true);
    setMyTicketsError(null);

    const response = await getMyBookings();

    if (response.success && response.data) {
      setMyTickets(response.data);
    } else {
      setMyTickets(null);
      setMyTicketsError(response.message || "Unable to load your tickets.");
    }

    setMyTicketsLoading(false);
  }, [authenticated]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMyTickets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMyTickets]);

  React.useEffect(() => {
    if (bookingToast.visible) {
      const timer = window.setTimeout(() => {
        void loadMyTickets();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [bookingToast.visible, loadMyTickets]);

  return (
    <main
      className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_30%),linear-gradient(180deg,#f7fbf8_0%,#ffffff_42%,#eef3ef_100%)] text-slate-950 
      dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_30%),linear-gradient(180deg,#0a1220_0%,#0f172a_50%,#111827_100%)] dark:text-slate-100"
    >
      {/* <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/18 blur-3xl dark:bg-emerald-500/8" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-emerald-200/18 blur-3xl dark:bg-slate-600/10" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl dark:bg-slate-700/10" />
      </div> */}

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

        {authenticated ? (
          <MyTicketsSection
            data={myTickets}
            loading={myTicketsLoading}
            error={myTicketsError}
          />
        ) : null}
      </section>
    </main>
  );
}
