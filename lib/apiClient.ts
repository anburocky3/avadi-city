export const apiClient = async <T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> => {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || data.error || "An unexpected error occurred",
    );
  }

  return data as T;
};
