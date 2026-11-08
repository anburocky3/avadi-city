import { AuthUser } from "@/types/auth";
import { toast } from "@/utils/toast";

export interface UpdateProfilePayload {
  updatedData: Partial<AuthUser>;
  avatarFile?: File | null;
}

const handleResponse = async <T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage = data.message || data.error || fallbackMessage;
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }

  return data as T;
};

export const authService = {
  /**
   * Fetches the current authenticated session.
   * Resolves to null on 401 without throwing so unauthenticated guests are handled smoothly.
   */
  getMe: async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.status === 401 || !res.ok) return null;

      const data = await res.json();
      return data.user || null;
    } catch (error) {
      console.error("Session verification error:", error);
      return null;
    }
  },

  /**
   * Multi-part form updater for profile text attributes and binary avatar payloads.
   */
  updateProfile: async ({
    updatedData,
    avatarFile,
  }: UpdateProfilePayload): Promise<AuthUser> => {
    const formData = new FormData();

    Object.entries(updatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await fetch("/api/auth/update-profile", {
      method: "PUT",
      credentials: "include",
      body: formData, // Browser automatically computes boundary header
    });

    const data = await handleResponse<{ user: AuthUser; message?: string }>(
      res,
      "Failed to update profile",
    );

    toast.success(data.message || "Profile updated successfully!");
    return data.user;
  },

  /**
   * Terminates active session token cookie.
   */
  logout: async (): Promise<{ success: boolean }> => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    return handleResponse<{ success: boolean }>(res, "Failed to log out");
  },
};
