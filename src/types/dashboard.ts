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
  latitude: number;
  longitude: number;
  distanceFromSalon?: number;
  status: string;
}

export interface AttendanceTodayResponse {
  success: boolean;
  attendance: AttendanceRecord | null;
  hasCheckedIn: boolean;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendance: AttendanceRecord;
}
