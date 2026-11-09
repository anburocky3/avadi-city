import type {
  ApplicationStatusType,
  JobVacancy,
  MyApplicationsResponse,
  UserApplication,
} from "@/features/jobs/types";

interface ApiResponse<T> {
  [key: string]: unknown;
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  appliedCompanies?: string[];
  applicationId?: string;
}

export class JobServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "JobServiceError";
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    throw new JobServiceError(
      payload.message || payload.error || "Job request failed.",
      response.status,
      payload as Record<string, unknown>,
    );
  }
  return payload.data as T;
}

export async function getMyApplications(): Promise<MyApplicationsResponse> {
  const response = await fetch("/api/jobs/my-applications", {
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<
    UserApplication[]
  >;

  if (!response.ok || payload.success !== true || !Array.isArray(payload.data)) {
    throw new JobServiceError(
      payload.message || "Failed to load job applications.",
      response.status,
      payload as Record<string, unknown>,
    );
  }
  return {
    applications: payload.data,
    appliedCompanies: payload.appliedCompanies || [],
  };
}

export async function getMyJobs(): Promise<JobVacancy[]> {
  const response = await fetch("/api/jobs?my=true", {
    credentials: "include",
  });
  const data = await readResponse<JobVacancy[]>(response);
  if (!Array.isArray(data)) throw new Error("Invalid job listings response.");
  return data;
}

export async function toggleJobFeatured(
  jobId: string,
  featured: boolean,
): Promise<void> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ featured }),
  });
  await readResponse(response);
}

export async function updateApplicantStatus(
  jobId: string,
  applicantId: string,
  status: ApplicationStatusType,
): Promise<void> {
  const response = await fetch(
    `/api/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(applicantId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  await readResponse(response);
}

export async function submitJobApplication(
  jobId: string,
  formData: FormData,
): Promise<{ applicationId?: string }> {
  const response = await fetch(
    `/api/jobs/${encodeURIComponent(jobId)}/apply`,
    {
      method: "POST",
      body: formData,
    },
  );
  const payload = (await response.json().catch(() => ({}))) as ApiResponse<
    unknown
  >;
  if (!response.ok || payload.success !== true) {
    throw new JobServiceError(
      payload.message || payload.error || "Failed to submit application.",
      response.status,
      payload as Record<string, unknown>,
    );
  }
  return { applicationId: payload.applicationId };
}
