async function responseData<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || fallback);
  return data as T;
}

export async function getLocalServiceProfile(): Promise<any> {
  const response = await fetch("/api/services/local", {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return responseData(response, "Failed to fetch service profile");
}

export async function registerLocalServiceProfile(data: any): Promise<void> {
  const response = await fetch("/api/services/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  await responseData(response, "Failed to register service");
}
