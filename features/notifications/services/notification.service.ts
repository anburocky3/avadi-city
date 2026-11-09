import type { ClaimNotification } from "@/features/notifications/types";

async function responseData<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
  return data as T;
}

export async function getClaimNotifications(
  role: "owner" | "requester",
): Promise<ClaimNotification[]> {
  const response = await fetch(`/api/lost-found/claims?role=${role}`, {
    credentials: "include",
  });
  if (!response.ok) return [];
  return responseData<ClaimNotification[]>(response, "Failed to load claim notifications");
}

export async function updateClaimNotification(
  claimId: string,
  action: "ACCEPTED" | "REJECTED",
): Promise<{ requesterName?: string; requesterPhone?: string }> {
  const response = await fetch(`/api/lost-found/claims/${claimId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return responseData(response, "Failed to update claim");
}
