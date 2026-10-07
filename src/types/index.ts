// Domain types for RailReserve. Dates are stored as ISO strings for simplicity.

export type Role = "PASSENGER" | "ADMIN";
export type ActiveStatus = "ACTIVE" | "INACTIVE";
export type ClassType = "1A" | "2A" | "3A" | "SL" | "CC" | "2S";
export const CLASS_TYPES: ClassType[] = ["1A", "2A", "3A", "SL", "CC", "2S"];
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type IdType = "AADHAAR" | "PAN" | "PASSPORT" | "VOTER_ID" | "DRIVING_LICENCE" | "STUDENT_ID";
export type SeatType = "LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER" | "WINDOW" | "AISLE";
export type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type PaymentMethod = "SIMULATED_UPI" | "SIMULATED_CARD" | "SIMULATED_NET_BANKING";
export type RefundStatus = "NOT_APPLICABLE" | "PENDING" | "PROCESSED";

export interface BaseDoc {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppUser extends BaseDoc {
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: ActiveStatus;
}

export interface Passenger extends BaseDoc {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email: string;
  idType: IdType;
  idNumber: string;
  status: ActiveStatus;
}

export interface Train extends BaseDoc {
  trainNumber: string;
  trainName: string;
  trainType: string;
  operator: string;
  status: ActiveStatus;
}

export interface Station extends BaseDoc {
  stationCode: string;
  stationName: string;
  city: string;
  state: string;
  status: ActiveStatus;
}

export interface Route extends BaseDoc {
  trainId: string;
  routeName: string;
  status: ActiveStatus;
}

export interface TrainRoute {
  id: string;
  routeId: string;
  trainId: string;
  stationId: string;
  sequenceNumber: number;
  arrivalTime: string; // "HH:mm" or "" for origin
  departureTime: string; // "HH:mm" or "" for terminus
  distanceKm: number; // cumulative distance from origin
  dayOffset: number; // 0 = same day as origin departure
}

export interface Schedule extends BaseDoc {
  trainId: string;
  journeyDate: string; // yyyy-MM-dd (origin departure date)
  departureDateTime: string;
  arrivalDateTime: string;
  status: ScheduleStatus;
}

export interface Coach extends BaseDoc {
  trainId: string;
  coachNumber: string;
  classType: ClassType;
  seatCapacity: number;
  status: ActiveStatus;
}

export interface Seat extends BaseDoc {
  coachId: string;
  trainId: string;
  coachNumber: string;
  seatNumber: number;
  seatType: SeatType;
  classType: ClassType;
  status: ActiveStatus;
}

/**
 * seatLocks/{scheduleId}_{seatId}
 * One document per occupied seat per schedule. Its deterministic ID is what
 * makes double booking impossible: a Firestore transaction refuses to create
 * a lock that already exists. Deleted when a reservation is cancelled.
 */
export interface SeatLock {
  id: string;
  scheduleId: string;
  seatId: string;
  reservationId: string;
  userId: string;
  createdAt: string;
}

export interface Reservation extends BaseDoc {
  pnr: string;
  userId: string;
  scheduleId: string;
  trainId: string;
  trainNumber: string;
  trainName: string;
  sourceStationId: string;
  destinationStationId: string;
  sourceName: string;
  destinationName: string;
  departureDateTime: string;
  arrivalDateTime: string;
  journeyDate: string;
  classType: ClassType;
  passengerCount: number;
  seatLabels: string[];
  seatLockIds: string[];
  totalFare: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  bookingTime: string;
}

export interface ReservationPassenger {
  id: string;
  reservationId: string;
  userId: string;
  passengerId: string;
  seatId: string;
  coachId: string;
  coachNumber: string;
  seatNumber: number;
  classType: ClassType;
  passengerNameSnapshot: string;
  ageSnapshot: number;
  genderSnapshot: Gender;
  fare: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
}

export interface Payment extends BaseDoc {
  reservationId: string;
  userId: string;
  pnr: string;
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDate: string;
  refundAmount: number;
  refundStatus: RefundStatus;
}

export interface Cancellation extends BaseDoc {
  reservationId: string;
  userId: string;
  pnr: string;
  reason: string;
  cancelledAt: string;
  originalFare: number;
  refundPercent: number;
  refundAmount: number;
  refundStatus: RefundStatus;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  createdAt: string;
}

/** One row in train-search results. */
export interface SearchResult {
  scheduleId: string;
  train: Train;
  source: Station;
  destination: Station;
  departureDateTime: string;
  arrivalDateTime: string;
  durationMinutes: number;
  distanceKm: number;
  classType: ClassType;
  totalSeats: number;
  availableSeats: number;
  farePerPassenger: number;
  coaches: Coach[];
}
