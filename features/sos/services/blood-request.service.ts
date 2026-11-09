async function ensureSuccess(response: Response, fallback: string): Promise<void> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
}

export async function createBloodRequest(request: unknown): Promise<void> {
  const response = await fetch("/api/blood-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  await ensureSuccess(response, "Failed to submit blood request");
}
