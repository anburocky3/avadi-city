import type { AddComplaintInput, Complaint } from "@/features/ward/types";

async function responseData<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
  return data as T;
}

export async function getComplaints(): Promise<Complaint[]> {
  try {
    const response = await fetch("/api/complaints", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function createComplaint(data: AddComplaintInput): Promise<Complaint> {
  const formData = new FormData();
  Object.entries({
    category: data.category,
    subCategory: data.subCategory,
    streetName: data.streetName,
    userWard: data.userWard,
    incidentWard: data.incidentWard || data.userWard,
    shareOnFeed: data.shareOnFeed,
    lat: data.lat,
    lng: data.lng,
    title: data.title,
    description: data.description,
  }).forEach(([key, value]) => formData.append(key, String(value)));
  data.images?.slice(0, 3).forEach((file) => formData.append("images", file));

  const response = await fetch("/api/complaints", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const result = await responseData<{ complaint: Complaint }>(
    response,
    "Failed to submit grievance report",
  );
  return result.complaint;
}

export async function upvoteComplaint(complaintId: string | number) {
  const response = await fetch(`/api/complaints/${complaintId}/upvote`, { method: "POST" });
  return responseData(response, "Upvote sync failed");
}
