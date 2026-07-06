export type UserRole = "user" | "admin" | "operator";

export interface User {
  id: number;
  name: string | null;
  username?: string | null;
  email: string;
  profile_image?: string | null;
  bio?: string | null;
  role: UserRole;
  is_verified?: boolean;
  is_active?: boolean;
  last_login_at?: string | null;
  address?: string | null;
  provider?: "local" | "google";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  user?: User;
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
}

export interface Route {
  id: number;
  source_city: string;
  destination_city: string;
  distance_km: number;
  estimated_duration: number;
  created_at: string;
}

export type BusType = "AC" | "NON_AC" | "SLEEPER" | "VIP";

export type BusStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Bus {
  id: number;
  bus_number: string;
  bus_type: BusType;
  capacity: number;
  operator_name: string | null;
  operator_id?: number | null;
  status: BusStatus;
}

export type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Schedule {
  id: number;
  route_id: number;
  bus_id: number;
  departure_time: string;
  arrival_time: string;
  fare: number;
  status: ScheduleStatus;
}

export type TripStatus = "SCHEDULED" | "CANCELLED" | "COMPLETED";

export interface Operator {
  id: number;
  owner_user_id: number;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  is_active: boolean;
  owner_name?: string | null;
  owner_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Trip = materialized instance of a schedule on a specific date.
 * Returned by both user search and admin/operator management.
 */
export interface Trip {
  trip_id: number;
  schedule_id: number;
  trip_date: string; // YYYY-MM-DD
  fare: number;
  status: TripStatus;
  actual_departure_time: string | null;
  actual_arrival_time: string | null;
  cancelled_reason: string | null;
  // Joined schedule fields
  departure_time: string;
  arrival_time: string;
  schedule_status: ScheduleStatus;
  repeat_days: number;
  // Joined route
  route_id: number;
  source_city: string;
  destination_city: string;
  // Joined bus
  bus_id: number;
  bus_number: string;
  bus_type: BusType;
  capacity: number;
  operator_name: string | null;
  operator_id: number | null;
  // Live availability
  available_seats: number;
  booked_seats?: number;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type BookingPaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface Booking {
  id: number;
  user_id: number;
  trip_id: number;
  schedule_id?: number; // legacy alias kept for older components
  booking_status: BookingStatus;
  payment_status: BookingPaymentStatus;
  total_amount: number;
  booking_time: string;
  user_email?: string | null;
  // Joined trip context (returned by /api/bookings/:id)
  trip_date?: string;
  trip_status?: TripStatus;
  cancelled_reason?: string | null;
}

export interface BookingSeat {
  id: number;
  booking_id: number;
  trip_id: number;
  schedule_id?: number; // legacy alias
  seat_number: string;
  price: number;
}

export interface BookingTicketSeat {
  seat_number: string;
  price: number;
}

export interface BookingTicketDetails {
  booking: Booking & {
    source_city: string;
    destination_city: string;
    departure_time: string;
    arrival_time: string;
    fare: number;
    schedule_status: ScheduleStatus;
    bus_number: string;
    bus_type: BusType;
    capacity: number;
    operator_name: string | null;
    user_email?: string | null;
  };
  seats: BookingTicketSeat[];
}

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "CARD";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
}
