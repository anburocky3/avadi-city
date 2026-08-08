"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation"; // 👈 Added usePathname

// APP VERSION
export const APP_VERSION = "v1.0.0";

// --- TYPESCRIPT INTERFACES ---
export interface AuthUser {
  id: string;
  name: string;
  avatar?: string;
  dob: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  wardNumber: number;
  streetName: string;
  isVerified: boolean;
}

export interface Volunteer {
  id: number | string;
  name: string;
  role?: string;
  phone?: string;
  ward?: number | string;
  [key: string]: any;
}

export interface Comment {
  id: number | string;
  author: string;
  authorAvatar?: string;
  authorId?: string | null;
  feedId: number | string;
  text: string;
  timestamp: string;
}

export interface Feed {
  id: number | string;
  authorName: string;
  authorAvatar: string;
  authorId: string;
  ward: string;
  text: string;
  imageUrl?: string | null;
  isEmergency?: boolean;
  category?: string;
  timestamp?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
}

export interface Complaint {
  id: number | string;
  title: string;
  description: string;
  category: string;
  ward: string | number;
  status: "Resolved" | "In Progress" | "Acknowledged" | string;
  imageUrl?: string;
  upvotes: number;
  author?: string;
}

interface WardContextType {
  // Feed State & Actions
  feeds: Feed[];
  isLoadingFeeds: boolean;
  refreshFeeds: () => Promise<void>;
  addFeed: (newFeed: Partial<Feed>) => Promise<boolean>;
  likeFeed: (feedId: string | number) => Promise<void>;
  addCommentToFeed: (
    feedId: string | number,
    commentText: string,
  ) => Promise<void>;

  // Complaint State & Actions
  complaints: Complaint[];
  addComplaint: (newComplaint: Partial<Complaint>) => Promise<boolean>;
  isLoadingComplaints: boolean;
  upvoteComplaint: (complaintId: string | number) => Promise<void>;

  // volunteers
  volunteers: Array<{ name: string; [key: string]: any }>;
  addVolunteer: (
    newVolunteer: Partial<{ name: string; [key: string]: any }>,
  ) => Promise<boolean>;

  // Blood Requests
  bloodGroup: string;
  addBloodRequest: (
    newRequest: Partial<{ name: string; bloodGroup: string; contact: string }>,
  ) => Promise<boolean>;

  // Session State
  activeWard: { id: number; name: string; hints?: string };
  userProfile: { name: string; wardNumber: number };
  updateProfile: (
    updatedData: Partial<AuthUser>,
    avatarFile?: File | null,
  ) => Promise<void>;

  // ward
  wards: Array<{ id: number; name: string }>;
  selectWard: (wardId: number) => void;

  // Alerts & Notifications
  alerts: any[];
  readAlerts: any[];
  dismissedAlerts: any[];

  authUser: AuthUser | null;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const WardContext = createContext<WardContextType | undefined>(undefined);

const fetchAuthUser = async (): Promise<AuthUser | null> => {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // 🟢 Explicitly tell browser to send the avadi_session cookie
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user || null;
  } catch (err) {
    console.error("Failed to fetch auth user:", err);
    return null;
  }
};

// --- API FETCHER HELPERS ---
const fetchFeedsFromDB = async (): Promise<Feed[]> => {
  const res = await fetch("/api/feeds", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load community feeds");
  const data = await res.json();

  return data.map((item: any) => ({
    ...item,
    likes: item.likesCount ?? item.likes ?? 0,
    likedByMe: Boolean(item.likedByMe),
    comments: item.comments || [],
  }));
};

const fetchComplaintsFromDB = async (): Promise<Complaint[]> => {
  try {
    const res = await fetch("/api/complaints", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return []; // Fallback to empty array if API route is not created yet
  }
};

export const WardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname(); // 👈 Track current route for security checks
  const queryClient = useQueryClient();

  // Local state to track instantaneous ward switching without page reloads
  const [overrideWardId, setOverrideWardId] = useState<number | null>(null);

  const updateProfile = async (
    updatedData: Partial<AuthUser>,
    avatarFile?: File | null,
  ) => {
    const formData = new FormData();

    if (updatedData.name) formData.append("name", updatedData.name);
    if (updatedData.dob) formData.append("dob", String(updatedData.dob));
    if (updatedData.bloodGroup)
      formData.append("bloodGroup", updatedData.bloodGroup);
    if (updatedData.gender) formData.append("gender", updatedData.gender);
    if (updatedData.phone) formData.append("phone", updatedData.phone);
    if (updatedData.email) formData.append("email", updatedData.email);

    // Append compressed avatar file if selected
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const res = await fetch("/api/auth/update-profile", {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    // Instantly update the React Query cache so all components reflect changes immediately
    queryClient.setQueryData(["authUser"], data.user);

    if (data.user?.wardNumber) {
      setOverrideWardId(data.user.wardNumber);
    }
  };

  // Query authenticated user session
  const { data: authUser = null, isLoading: isLoadingAuth } =
    useQuery<AuthUser | null>({
      queryKey: ["authUser"],
      queryFn: fetchAuthUser,
      staleTime: 5 * 60 * 1000, // Cache user session for 5 minutes
      retry: false,
    });

  console.log("authUser in WardProvider:", authUser); // Debugging line to check authUser state

  const isAuthenticated = Boolean(authUser);

  // --- 🛡️ SECURITY GUARDRAIL EFFECT ---
  // If MySQL tables are wiped or user record is deleted, kick them to login immediately!
  useEffect(() => {
    // Define your public pages where unauthenticated guests are allowed
    const publicRoutes = [
      "/",
      "/login",
      "/get-started",
      "/credits",
      "/contact",
    ];
    const isProtectedRoute = !publicRoutes.includes(pathname);

    // Once auth check finishes, if there is no valid user on a protected page -> redirect
    if (!isLoadingAuth && !authUser && isProtectedRoute) {
      router.replace("/login");
    }
  }, [isLoadingAuth, authUser, pathname, router]);

  // Initialize guest override from localStorage if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedWard = localStorage.getItem("activeWard");
      if (savedWard && !authUser?.wardNumber) {
        setOverrideWardId(Number(savedWard));
      }
    }
  }, [authUser?.wardNumber]);

  // Logout Handler
  const logout = async () => {
    try {
      // 1. Call server API to destroy session cookie
      await fetch("/api/auth/logout", { method: "POST" });

      // 2. Wipe auth and user data from React Query cache instantly
      queryClient.setQueryData(["authUser"], null);
      queryClient.removeQueries({ queryKey: ["authUser"] });
      queryClient.removeQueries({ queryKey: ["feeds"] });
      queryClient.removeQueries({ queryKey: ["complaints"] });

      // 3. Reset storage
      setOverrideWardId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeWard");
      }

      // 4. Redirect straight to login or home, and refresh router cache
      router.push("/login"); // 👈 Change to "/login" to prevent guest flash if auth is required
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Ensure activeWard prioritizes instant local selections, then auth profile, defaulting to Ward 14
  const activeWardId = overrideWardId || authUser?.wardNumber || 14;
  const isMatchingUserWard = activeWardId === authUser?.wardNumber;

  const activeWard = {
    id: activeWardId,
    name:
      authUser?.streetName && isMatchingUserWard
        ? `${authUser.streetName}`
        : `Ward ${activeWardId}`,
    hints:
      authUser?.streetName && isMatchingUserWard
        ? authUser.streetName
        : "Active Municipal Ward",
  };

  const userProfile = authUser
    ? {
        name: authUser.name,
        wardNumber: authUser.wardNumber,
        avatar: authUser.avatar,
      }
    : {
        name: "Guest",
        wardNumber: activeWardId,
        avatar: "/default-avatar.png",
      };

  // 2. TANSTACK QUERY: FETCH FEEDS
  const {
    data: feeds = [],
    isLoading: isLoadingFeeds,
    refetch: refetchFeeds,
  } = useQuery<Feed[]>({
    queryKey: ["feeds"],
    queryFn: fetchFeedsFromDB,
  });

  // 3. TANSTACK QUERY: FETCH COMPLAINTS
  const { data: complaints = [], isLoading: isLoadingComplaints } = useQuery<
    Complaint[]
  >({
    queryKey: ["complaints"],
    queryFn: fetchComplaintsFromDB,
  });

  const refreshFeeds = async () => {
    await refetchFeeds();
  };

  // 4. MUTATION: CREATE FEED
  const createFeedMutation = useMutation({
    mutationFn: async (newFeed: Partial<Feed>) => {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFeed),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to publish feed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const addFeed = async (newFeed: Partial<Feed>): Promise<boolean> => {
    try {
      await createFeedMutation.mutateAsync(newFeed);
      return true;
    } catch (error) {
      console.error("Feed creation failed:", error);
      return false;
    }
  };

  // 5. MUTATION: OPTIMISTIC LIKE TOGGLE
  const likeMutation = useMutation({
    mutationFn: async (feedId: string | number) => {
      const res = await fetch(`/api/feeds/${feedId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Database like sync failed");
      return res.json(); // Returns { success: true, likedByMe: boolean, likes: number }
    },
    onMutate: async (feedId) => {
      await queryClient.cancelQueries({ queryKey: ["feeds"] });
      const previousFeeds = queryClient.getQueryData<Feed[]>(["feeds"]);

      queryClient.setQueryData<Feed[]>(["feeds"], (old = []) =>
        old.map((f) => {
          if (String(f.id) === String(feedId)) {
            const liked = !f.likedByMe;
            return {
              ...f,
              likedByMe: liked,
              likes: liked ? f.likes + 1 : Math.max(0, f.likes - 1),
            };
          }
          return f;
        }),
      );

      return { previousFeeds };
    },
    // 🟢 OPTIONAL UPGRADE: Update cache with actual server response data
    onSuccess: (data, feedId) => {
      queryClient.setQueryData<Feed[]>(["feeds"], (old = []) =>
        old.map((f) => {
          if (String(f.id) === String(feedId)) {
            return {
              ...f,
              likedByMe: data.likedByMe,
              likes: data.likes,
            };
          }
          return f;
        }),
      );
    },
    onError: (err, feedId, context) => {
      console.error("Like sync error, reverting:", err);
      if (context?.previousFeeds) {
        queryClient.setQueryData(["feeds"], context.previousFeeds);
      }
    },
    onSettled: () => {
      // Optional: you can remove invalidateQueries if success handles it,
      // or keep it to ensure fresh data across other tabs/users.
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const likeFeed = async (feedId: string | number) => {
    likeMutation.mutate(feedId);
  };

  // 6. MUTATION: OPTIMISTIC COMMENT INSERTION
  const commentMutation = useMutation({
    mutationFn: async ({
      feedId,
      text,
    }: {
      feedId: string | number;
      text: string;
    }) => {
      const res = await fetch(`/api/feeds/${feedId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: userProfile.name || "Avadi Resident",
          authorAvatar: userProfile.avatar || "/default-avatar.png",
          authorId: authUser?.id || null,
          text,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: (newComment, variables) => {
      queryClient.setQueryData<Feed[]>(["feeds"], (old = []) =>
        old.map((f) =>
          String(f.id) === String(variables.feedId)
            ? { ...f, comments: [...(f.comments || []), newComment] }
            : f,
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const addCommentToFeed = async (
    feedId: string | number,
    commentText: string,
  ) => {
    commentMutation.mutate({ feedId, text: commentText });
  };

  // 7. MUTATION: OPTIMISTIC COMPLAINT UPVOTE
  const upvoteMutation = useMutation({
    mutationFn: async (complaintId: string | number) => {
      const res = await fetch(`/api/complaints/${complaintId}/upvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Upvote sync failed");
      return res.json();
    },
    onMutate: async (complaintId) => {
      await queryClient.cancelQueries({ queryKey: ["complaints"] });
      const previousComplaints = queryClient.getQueryData<Complaint[]>([
        "complaints",
      ]);

      queryClient.setQueryData<Complaint[]>(["complaints"], (old = []) =>
        old.map((c) =>
          String(c.id) === String(complaintId)
            ? { ...c, upvotes: c.upvotes + 1 }
            : c,
        ),
      );

      return { previousComplaints };
    },
    onError: (err, complaintId, context) => {
      console.error("Upvote sync error, reverting:", err);
      if (context?.previousComplaints) {
        queryClient.setQueryData(["complaints"], context.previousComplaints);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });

  const upvoteComplaint = async (complaintId: string | number) => {
    upvoteMutation.mutate(complaintId);
  };

  const addComplaint = async (
    newComplaint: Partial<Complaint>,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComplaint),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit complaint");
      }
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      return true;
    } catch (error) {
      console.error("Complaint submission failed:", error);
      return false;
    }
  };

  const addBloodRequest = async (
    newRequest: Partial<{ name: string; bloodGroup: string; contact: string }>,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/blood-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit blood request");
      }
      queryClient.invalidateQueries({ queryKey: ["blood-requests"] });
      return true;
    } catch (error) {
      console.error("Blood request submission failed:", error);
      return false;
    }
  };

  const addVolunteer = async (
    newVolunteer: Partial<{
      name: string;
      bloodGroup: string;
      contact: string;
    }>,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVolunteer),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit volunteer request");
      }
      queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      return true;
    } catch (error) {
      console.error("Volunteer request submission failed:", error);
      return false;
    }
  };

  const bloodGroup = authUser?.bloodGroup || "Unknown";

  // Generated all 48 wards of Avadi Municipal Corporation
  const wards = Array.from({ length: 48 }, (_, i) => ({
    id: i + 1,
    name: `Ward ${i + 1}`,
  }));

  // Option 1 Implementation: Instantly updates state & storage, then refreshes server components in-place
  const selectWard = (wardId: number | string) => {
    // 1. Force conversion to Number to prevent strict equality failures (e.g. "15" === 15)
    const id = Number(wardId);
    const selectedWard = wards.find((w) => w.id === id);

    if (selectedWard) {
      // 2. Set immediate local override state
      setOverrideWardId(id);

      // 3. Persist selection to browser storage
      if (typeof window !== "undefined") {
        localStorage.setItem("activeWard", String(id));
      }

      // 4. Instantly update React Query cache for authUser so it doesn't revert to Ward 1!
      queryClient.setQueryData(["authUser"], (oldUser: any) =>
        oldUser ? { ...oldUser, wardNumber: id } : oldUser,
      );

      // 5. Refresh server components in place
      router.refresh();
    }
  };

  return (
    <WardContext.Provider
      value={{
        feeds,
        isLoadingFeeds,
        complaints,
        isLoadingComplaints,
        activeWard,
        userProfile,
        refreshFeeds,
        addFeed,
        likeFeed,
        addCommentToFeed,
        upvoteComplaint,
        addComplaint,
        bloodGroup,
        addBloodRequest,
        addVolunteer,
        wards,
        selectWard,
        volunteers: [],
        updateProfile,
        alerts: [],
        readAlerts: [],
        dismissedAlerts: [],
        authUser,
        isLoadingAuth,
        isAuthenticated,
        logout,
      }}
    >
      {children}
    </WardContext.Provider>
  );
};

export const useWard = () => {
  const context = useContext(WardContext);
  if (!context) throw new Error("useWard must be used within a WardProvider");
  return context;
};
