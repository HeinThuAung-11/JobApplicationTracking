export interface JobApplication {
  id: number;
  company: string;
  position: string;
  status: string;
  description?: string | null;
  jobUrl?: string | null;
  applyDate?: string | null;
  createdAt: string;
  userId?: string | null;
  notes?: Note[];
}

export interface Note {
  id: number;
  content: string;
  jobApplicationId: number;
  createdAt: string;
}

export interface CreateJobInput {
  company: string;
  position: string;
  status: string;
  description?: string;
  jobUrl?: string;
  applyDate?: string;
}

export interface UpdateJobInput {
  company?: string;
  position?: string;
  status?: string;
  description?: string;
  jobUrl?: string;
  applyDate?: string;
}

export interface CreateNoteInput {
  content: string;
}

export type JobStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "accepted"
  | "withdrawn";

export const JOB_STATUSES: JobStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "accepted",
  "withdrawn",
];

export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  recent: JobApplication[];
}

// Authentication types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

