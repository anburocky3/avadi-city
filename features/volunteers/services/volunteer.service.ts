async function ensureSuccess(response: Response, fallback: string): Promise<void> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
}

export async function createVolunteer(volunteer: unknown): Promise<void> {
  const response = await fetch("/api/volunteers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(volunteer),
  });
  await ensureSuccess(response, "Failed to submit volunteer request");
}
