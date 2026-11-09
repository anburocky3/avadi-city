export interface JobVacancy {
  id: string;
  role: string;
  businessName: string;
  category?: string;
  jobType?: "Full-Time" | "Part-Time" | "Contract" | string;
  workMode?: string;
  postedTime?: string;
  salary: string;
  location?: string;
  shift?: string;
  contact: string;
  ward: number;
  details: string;
  requirements?: string[];
  qualifications?: string;
  status?: string;
  featured?: boolean;
  totalApplications?: number;
  newApplications?: number;
  ownerId?: string;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
}

export interface UserApplication {
  id: string;
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  resumeFileName?: string | null;
  coverLetter?: string | null;
  qualification?: string | null;
  experience?: string | null;
  skills?: string | null;
  portfolioUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  job?: {
    id: string;
    role: string;
    businessName: string;
    category?: string;
    jobType?: string;
    workMode?: string;
    salary: string;
    location?: string;
    ward?: number;
    imageUrl?: string | null;
    status: string;
    ownerId?: string;
  } | null;
}

export type ApplicationStatusType =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "HIRED"
  | "REJECTED";

export interface ApplicantItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string | null;
  hasResume?: boolean;
  coverLetter?: string | null;
  qualification?: string | null;
  experience?: string | null;
  skills?: string | null;
  portfolioUrl?: string | null;
  resumeFileName?: string | null;
  status: ApplicationStatusType;
  createdAt: string;
  updatedAt?: string;
}

export interface JobMeta {
  id: string;
  role: string;
  businessName: string;
  location?: string | null;
  ward: number;
  status: string;
  jobType?: string;
  workMode?: string;
}

export interface JobDetailSummary {
  id: string;
  role: string;
  businessName: string;
  location?: string;
  salary?: string;
  jobType?: string;
  workMode?: string;
  qualifications?: string;
  details?: string;
}

export interface JobProfile {
  name?: string;
  email?: string;
  phone?: string;
}

export interface MyApplicationsResponse {
  applications: UserApplication[];
  appliedCompanies: string[];
}
