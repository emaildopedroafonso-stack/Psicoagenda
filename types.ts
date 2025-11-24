export enum Periodicity {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  SINGLE = 'SINGLE'
}

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED'
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  PATIENT_ABSENT = 'PATIENT_ABSENT',
  THERAPIST_ABSENT = 'THERAPIST_ABSENT',
  CANCELLED = 'CANCELLED',
  UNCONFIRMED = 'UNCONFIRMED'
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string; // ISO Date
  valuePerSession: number;
  periodicity: Periodicity;
  dayOfWeek?: number; // 0 (Sunday) - 6 (Saturday)
  status: PatientStatus;
  notes?: string;
  requiresReceipt?: boolean;
}

export interface Session {
  id: string;
  patientId: string; // If 'unmatched', it requires manual assignment
  date: string; // ISO DateTime
  status: SessionStatus;
  paid: boolean;
  valueSnapshot: number; // Value at the time of generation
  notes?: string;
  importedName?: string; // Name from external calendar
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface FinancialSummary {
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  sessionsCount: number;
}