export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'RECEPTIONIST' | string;

export interface RoleInfo {
  id: string;
  name: string;
  code: UserRole;
}

export interface SalonInfo {
  id: string;
  name: string;
  code: string;
  openingTime?: string;
  closingTime?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  salonId: string | null;
  salon: SalonInfo | null;
  roleId: string | null;
  role: RoleInfo | null;
  permissions: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface StoredSession {
  token: string;
  user: User;
}
