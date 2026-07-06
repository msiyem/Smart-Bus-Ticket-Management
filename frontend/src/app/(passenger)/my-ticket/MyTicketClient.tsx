'use client';
import { getMyBookings } from '@/action/booking.action';
import { MyTicketsSection } from '@/components/buy-ticket/my-tickets-section';
import { MyBookingsResponse } from '@/types/booking';
import React, { useState } from 'react'

export default function MyTicketClient() {
  const [myTickets, setMyTickets] = useState<MyBookingsResponse | null>(
    null,
  );
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);
  const [myTicketsError, setMyTicketsError] = useState<string | null>(
    null,
  );
    const loadMyTickets = React.useCallback(async () => {

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
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMyTickets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadMyTickets]);
  return (
    <>
    <MyTicketsSection
            data={myTickets}
            loading={myTicketsLoading}
            error={myTicketsError}
          />
    </>
  )
}
