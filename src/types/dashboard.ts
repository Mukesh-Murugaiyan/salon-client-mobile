export interface SalonLocationConfig {
  latitude: number | null;
  longitude: number | null;
  allowedRadius: number;
  salonName?: string;
}

export interface DashboardSummary {
  todayAppointments: number;
  confirmedAppointments?: number;
  activeClients?: number;
  staffCount?: number;
  userCount?: number;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | string;
  salonName: string;
  openingTime?: string;
  closingTime?: string;
  salonLocation?: SalonLocationConfig | null;
}

export interface PlanDetails {
  id?: string;
  name: string;
  description?: string;
  price?: number;
  durationInDays?: number;
  maxStaff?: number;
  maxAppointments?: number;
}

export interface SubscriptionStatusData {
  salonId?: string;
  salonName?: string;
  status: 'ACTIVE' | 'EXPIRED' | string;
  isExpired: boolean;
  startDate?: string;
  endDate?: string;
  daysRemaining: number;
  plan?: PlanDetails | null;
}

export interface AttendanceRecord {
  id?: string;
  _id?: string;
  salonId: string;
  userId: string | { name: string; email: string };
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  latitude: number;
  longitude: number;
  distanceFromSalon?: number;
  status: string;
}

export interface AttendanceTodayResponse {
  success: boolean;
  attendance: AttendanceRecord | null;
  hasCheckedIn: boolean;
  hasCheckedOut?: boolean;
  salonLocation?: SalonLocationConfig | null;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendance: AttendanceRecord;
  distanceFromSalon?: number;
  allowedRadius?: number;
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  attendance: AttendanceRecord;
}
