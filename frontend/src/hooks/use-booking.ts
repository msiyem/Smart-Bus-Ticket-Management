import type { SearchState } from "@/types/booking";
import { useBookingSearch } from "./use-booking-search";
import { MAX_SEATS_PER_BOOKING, useSeatManager } from "./use-seat-manager";
import { useBookingAction } from "./use-booking-action";
import { useBookingStore } from "@/store/booking.store";

type UseBookingParams = {
  ensureAuthenticated: () => Promise<boolean>;
  onRequireAuth: () => void;
  initialSearch?: Partial<SearchState>;
  autoSearchOnMount?: boolean;
};

export function useBooking(params: UseBookingParams) {
  const bookingSearch = useBookingSearch();

  const seatManager = useSeatManager();

  const bookingAction = useBookingAction({
    onRequireAuth: params.onRequireAuth,
    ensureAuthenticated: params.ensureAuthenticated,
    selectedSeats: seatManager.selectedSeats,
    clearSelectedSeats: seatManager.clearSelectedSeats,
  });

  const { loadAvailableSeatsForTrip, toggleSeat, ...seatManagerRest } =
    seatManager;

  return {
    ...useBookingStore(),

    ...bookingSearch,

    ...seatManagerRest,

    handleTripSelect: loadAvailableSeatsForTrip,
    handleScheduleSelect: loadAvailableSeatsForTrip,
    handleSeatToggle: toggleSeat,
    maxSeatsPerBooking: MAX_SEATS_PER_BOOKING,

    ...bookingAction,
  };
}
