export type TripSearchResult = {
  trip_id: number;
  schedule_id: number;
  trip_date: string; // YYYY-MM-DD
  departure_time: string;
  arrival_time: string;
  fare: number;
  status: "SCHEDULED" | "CANCELLED" | "COMPLETED";
  actual_departure_time?: string | null;
  actual_arrival_time?: string | null;
  cancelled_reason?: string | null;
  repeat_days: number;
  bus_number: string;
  operator_name: string | null;
  capacity: number;
  bus_type: string;
  source_city: string;
  destination_city: string;
  route_id: number;
  bus_id: number;
  operator_id?: number | null;
  available_seats: number | null;
};

export type ScheduleSearchResult = TripSearchResult;

export type ScheduleTemplate = {
  id: number;
  route_id: number;
  bus_id: number;
  departure_time: string;
  arrival_time: string;
  fare: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  repeat_days: number;
  bus_number: string;
  bus_type: string;
  capacity: number;
  operator_name: string | null;
  operator_id?: number | null;
  source_city: string;
  destination_city: string;
};

export type SeatCell = {
  seatNumber: string;
  available: boolean;
};

export type SeatRow = {
  row: string;
  cells: SeatCell[];
};

export type BookingSummary = {
  bookingId: number;
  trip: TripSearchResult;
  seats: string[];
  totalAmount: number;
};

export type SearchState = {
  source: string;
  destination: string;
  date: string;
};

export type LoadingState = {
  search: boolean;
  seats: boolean;
  booking: boolean;
};

export type StatusState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export type BookingToastState = {
  visible: boolean;
  id: number | null;
};

export type BookingTripItem = {
  booking: {
    id: number;
    trip_id: number;
    schedule_id?: number;
    booking_status: "PENDING" | "CONFIRMED" | "CANCELLED";
    payment_status: "UNPAID" | "PAID" | "REFUNDED";
    total_amount: number;
    booking_time: string;
    trip_date?: string;
    trip_status?: "SCHEDULED" | "CANCELLED" | "COMPLETED";
    cancelled_reason?: string | null;
    departure_time: string;
    arrival_time: string;
    fare: number;
    schedule_status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    source_city: string;
    destination_city: string;
    bus_number: string;
    bus_type: string;
    capacity: number;
    operator_name: string | null;
  };
  seats: {
    seat_number: string;
    price: number;
  }[];
  trip_status: "UPCOMING" | "PAST";
};

export type MyBookingsResponse = {
  upcomingTrips: BookingTripItem[];
  recentPastTrips: BookingTripItem[];
};
