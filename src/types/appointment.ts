export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface ClientSummary {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface StaffSummary {
  id: string;
  name: string;
  title?: string;
  specialization?: string;
}

export interface ServiceSummary {
  id: string;
  name: string;
  durationInMinutes?: number;
  price?: number;
}

export interface Appointment {
  id: string;
  _id?: string;
  salonId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  client: ClientSummary | null;
  staff: StaffSummary | null;
  service: ServiceSummary | null;
  createdAt?: string;
}

export interface AppointmentsResponse {
  success: boolean;
  appointments: Appointment[];
}
