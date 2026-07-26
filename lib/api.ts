// src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const fullUrl = `${BASE_URL}${endpoint}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Include fullUrl in the error message for easy debugging
    throw new Error(
      errorData.message ||
        `API Error (${response.status}) at ${fullUrl}: ${response.statusText}`,
    );
  }

  return response.json();
}
