import { create } from "zustand";

import type {
  BookingSummary,
  BookingToastState,
  LoadingState,
  SearchState,
  StatusState,
  TripSearchResult,
} from "@/types/booking";

type BookingStore = {
  search: SearchState;
  setSearch: (
    value:
      | SearchState
      | ((prev: SearchState) => SearchState),
  ) => void;

  results: TripSearchResult[];
  setResults: (
    results: TripSearchResult[],
  ) => void;

  activeTrip: TripSearchResult | null;
  setActiveTrip: (
    trip: TripSearchResult | null,
  ) => void;

  availableSeats: string[];
  setAvailableSeats: (seats: string[]) => void;

  seatSheetOpen: boolean;
  setSeatSheetOpen: (open: boolean) => void;

  loading: LoadingState;
  setLoading: (
    value:
      | LoadingState
      | ((prev: LoadingState) => LoadingState),
  ) => void;

  status: StatusState;
  setStatus: (status: StatusState) => void;

  bookingSummary: BookingSummary | null;
  setBookingSummary: (
    summary: BookingSummary | null,
  ) => void;

  bookingToast: BookingToastState;
  setBookingToast: (
    toast: BookingToastState,
  ) => void;

  resetBookingState: () => void;
};

export const useBookingStore =
  create<BookingStore>((set) => ({
    search: {
      source: "",
      destination: "",
      date: "",
    },

    setSearch: (value) =>
      set((state) => ({
        search:
          typeof value === "function"
            ? value(state.search)
            : value,
      })),

    results: [],
    setResults: (results) => set({ results }),

    activeTrip: null,
    setActiveTrip: (activeTrip) =>
      set({ activeTrip }),

    availableSeats: [],
    setAvailableSeats: (availableSeats) =>
      set({ availableSeats }),

    seatSheetOpen: false,
    setSeatSheetOpen: (seatSheetOpen) =>
      set({ seatSheetOpen }),

    loading: {
      search: false,
      seats: false,
      booking: false,
    },

    setLoading: (value) =>
      set((state) => ({
        loading:
          typeof value === "function"
            ? value(state.loading)
            : value,
      })),

    status: null,
    setStatus: (status) => set({ status }),

    bookingSummary: null,
    setBookingSummary: (bookingSummary) =>
      set({ bookingSummary }),

    bookingToast: {
      visible: false,
      id: null,
    },

    setBookingToast: (bookingToast) =>
      set({ bookingToast }),

    resetBookingState: () =>
      set({
        results: [],
        activeTrip: null,
        availableSeats: [],
        seatSheetOpen: false,
        bookingSummary: null,
        status: null,
      }),
  }));