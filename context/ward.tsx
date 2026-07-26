"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Replace these import paths with your actual data file locations
import { wards } from "@/data/wards";
import { initialComplaints } from "@/data/complaints";
import { initialPosts } from "@/data/posts";
import { initialAlerts } from "@/data/alerts";
import { initialVolunteersData } from "@/data/volunteerSpots";
import { initialRentals, initialJobs } from "@/data/listings";
import { initialDonations } from "@/data/donations";
import { initialServices } from "@/data/services";

// --- TYPESCRIPT DEFINITIONS ---

export interface Ward {
  id: number;
  name: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  dob: string;
  bloodGroup: string;
  gender: string;
  wardNumber: number;
}

export interface Complaint {
  id: number | string;
  issueId: string;
  upvotes: number;
  status: "Submitted" | "Pending" | "In Progress" | "Resolved";
  date: string;
  author: string;
  ward?: string | number;
  title?: string;
  description?: string;
  category?: string;
  imageUrl?: string | null;
  [key: string]: any;
}

export interface Comment {
  id: number | string;
  author: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: number | string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  timestamp: string;
  authorName?: string;
  authorAvatar?: string;
  ward: string | number;
  text: string;
  imageUrl?: string | null;
  isEmergency?: boolean;
  [key: string]: any;
}

export interface Alert {
  id: number | string;
  title: string;
  description: string;
  category: string;
  severity: "urgent" | "warning" | "info" | "danger";
  affectedWards: "All" | number[];
  date?: string;
}

export interface Volunteer {
  id: number | string;
  name: string;
  role?: string;
  phone?: string;
  ward?: number | string;
  [key: string]: any;
}

export interface Job {
  id: number | string;
  title?: string;
  company?: string;
  location?: string;
  postedDate?: string;
  [key: string]: any;
}

export interface Rental {
  id: number | string;
  title: string;
  price?: string | number;
  location?: string;
  postedDate: string;
  [key: string]: any;
}

export interface Donation {
  id: number | string;
  title?: string;
  category?: string;
  [key: string]: any;
}

export interface Service {
  id: number | string;
  name: string;
  rating: number;
  verified: boolean;
  ward: number;
  category?: string;
  phone?: string;
  [key: string]: any;
}

export interface BloodRequest {
  id?: number | string;
  patientName: string;
  bloodGroup: string;
  hospitalName: string;
  contactNumber: string;
  date?: string;
  [key: string]: any;
}

export interface WardContextType {
  wards: Ward[];
  userProfile: UserProfile;
  hasOnboarded: boolean;
  complaints: Complaint[];
  posts: Post[];
  alerts: Alert[];
  volunteers: Volunteer[];
  rentals: Rental[];
  jobs: Job[];
  donations: Donation[];
  services: Service[];
  bloodRequests: BloodRequest[];
  dismissedAlerts: (string | number)[];
  readAlerts: (string | number)[];
  activeWard: Ward;
  selectWard: (wardId: number | string) => void;
  completeOnboarding: (profileData: UserProfile) => void;
  updateProfile: (profileData: Partial<UserProfile>) => void;
  resetOnboarding: () => void;
  addComplaint: (newComplaint: Partial<Complaint>) => Complaint;
  upvoteComplaint: (complaintId: number | string) => void;
  addPost: (newPost: Partial<Post>) => void;
  likePost: (postId: number | string) => void;
  addCommentToPost: (postId: number | string, commentText: string) => void;
  addVolunteer: (newVolunteer: Partial<Volunteer>) => void;
  addJob: (newJob: Partial<Job>) => void;
  addRental: (newRental: Partial<Rental>) => void;
  addService: (newService: Partial<Service>) => Service;
  addBloodRequest: (newRequest: BloodRequest) => void;
  dismissAlert: (alertId: number | string) => void;
  markAlertAsRead: (alertId: number | string) => void;
}

const WardContext = createContext<WardContextType | undefined>(undefined);

export const WardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Safe helper to load state from localStorage during client-side hydration
  const getLocalState = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") {
      return fallback;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reset") === "true") {
        localStorage.clear();
        return fallback;
      }
      const data = localStorage.getItem(`avadi-city-${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.error(
        `Error reading localStorage key "avadi-city-${key}":`,
        error,
      );
      return fallback;
    }
  };

  const normalizeAlerts = (alerts: any[] = []): Alert[] =>
    alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      category: alert.category,
      severity: ["urgent", "warning", "info", "danger"].includes(alert.severity)
        ? (alert.severity as Alert["severity"])
        : "info",
      affectedWards: Array.isArray(alert.affectedWards)
        ? alert.affectedWards
        : "All",
      date: alert.date,
    }));

  // State initialization
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    getLocalState<UserProfile>("profile", {
      name: "",
      phone: "",
      email: "",
      dob: "",
      bloodGroup: "",
      gender: "",
      wardNumber: 14,
    }),
  );

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() =>
    getLocalState<boolean>("onboarded", true),
  );
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    getLocalState<Complaint[]>(
      "complaints",
      (initialComplaints || []) as Complaint[],
    ),
  );
  const [posts, setPosts] = useState<Post[]>(() =>
    getLocalState<Post[]>("posts", initialPosts || []),
  );
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    getLocalState<Alert[]>("alerts", normalizeAlerts(initialAlerts || [])),
  );
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() =>
    getLocalState<Volunteer[]>("volunteers", initialVolunteersData || []),
  );
  const [rentals, setRentals] = useState<Rental[]>(() =>
    getLocalState<Rental[]>("rentals", initialRentals || []),
  );
  const [jobs, setJobs] = useState<Job[]>(() =>
    getLocalState<Job[]>("jobs", initialJobs || []),
  );
  const [donations, setDonations] = useState<Donation[]>(() =>
    getLocalState<Donation[]>("donations", initialDonations || []),
  );
  const [services, setServices] = useState<Service[]>(() =>
    getLocalState<Service[]>("services", initialServices || []),
  );
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>(() =>
    getLocalState<BloodRequest[]>("blood-requests", []),
  );
  const [dismissedAlerts, setDismissedAlerts] = useState<(string | number)[]>(
    () => getLocalState<(string | number)[]>("dismissed-alerts", []),
  );
  const [readAlerts, setReadAlerts] = useState<(string | number)[]>(() =>
    getLocalState<(string | number)[]>("read-alerts", []),
  );

  // Sync to localStorage safely on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-profile", JSON.stringify(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "avadi-city-onboarded",
        JSON.stringify(hasOnboarded),
      );
    }
  }, [hasOnboarded]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-complaints", JSON.stringify(complaints));
    }
  }, [complaints]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-posts", JSON.stringify(posts));
    }
  }, [posts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-alerts", JSON.stringify(alerts));
    }
  }, [alerts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-volunteers", JSON.stringify(volunteers));
    }
  }, [volunteers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-rentals", JSON.stringify(rentals));
    }
  }, [rentals]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-jobs", JSON.stringify(jobs));
    }
  }, [jobs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-donations", JSON.stringify(donations));
    }
  }, [donations]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("avadi-city-services", JSON.stringify(services));
    }
  }, [services]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "avadi-city-blood-requests",
        JSON.stringify(bloodRequests),
      );
    }
  }, [bloodRequests]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "avadi-city-dismissed-alerts",
        JSON.stringify(dismissedAlerts),
      );
    }
  }, [dismissedAlerts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "avadi-city-read-alerts",
        JSON.stringify(readAlerts),
      );
    }
  }, [readAlerts]);

  // Derived Ward details with safe fallback
  const activeWard = (wards &&
    wards.find((w: Ward) => w.id === Number(userProfile.wardNumber))) ||
    (wards && wards[13]) || { id: 14, name: "Avadi Central" };

  // Operations
  const selectWard = (wardId: number | string) => {
    setUserProfile((prev) => ({ ...prev, wardNumber: Number(wardId) }));
  };

  const completeOnboarding = (profileData: UserProfile) => {
    setUserProfile(profileData);
    setHasOnboarded(true);
  };

  const updateProfile = (profileData: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profileData }));
  };

  const resetOnboarding = () => {
    setUserProfile({
      name: "",
      phone: "",
      email: "",
      dob: "",
      bloodGroup: "",
      gender: "",
      wardNumber: 14,
    });
    setHasOnboarded(false);
  };

  const addComplaint = (newComplaint: Partial<Complaint>): Complaint => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedIssueId = newComplaint.issueId || `AVD-2026-${randomNum}`;
    const createdComplaint: Complaint = {
      id: Date.now(),
      issueId: generatedIssueId,
      upvotes: 0,
      status: "Submitted",
      date: new Date().toISOString(),
      author: userProfile.name || "Avadi Resident",
      ...newComplaint,
    };

    setComplaints((prev) => [createdComplaint, ...prev]);
    return createdComplaint;
  };

  const upvoteComplaint = (complaintId: number | string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, upvotes: c.upvotes + 1 } : c,
      ),
    );
  };

  const addPost = (newPost: Partial<Post>) => {
    setPosts((prev) => [
      {
        id: prev.length + 1,
        likes: 0,
        likedByMe: false,
        comments: [],
        timestamp: new Date().toISOString(),
        ward: userProfile.wardNumber || 14,
        text: "",
        ...newPost,
      } as Post,
      ...prev,
    ]);
  };

  const likePost = (postId: number | string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.likedByMe;
          return {
            ...p,
            likedByMe: liked,
            likes: liked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      }),
    );
  };

  const addCommentToPost = (postId: number | string, commentText: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newComment: Comment = {
            id: Date.now(),
            author: userProfile.name || "Anonymous Resident",
            text: commentText,
            timestamp: new Date().toISOString(),
          };
          return {
            ...p,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      }),
    );
  };

  const addVolunteer = (newVolunteer: Partial<Volunteer>) => {
    setVolunteers((prev) => [
      {
        id: prev.length + 1,
        name: "Volunteer",
        ...newVolunteer,
      } as Volunteer,
      ...prev,
    ]);
  };

  const addJob = (newJob: Partial<Job>) => {
    setJobs((prev) => [
      {
        id: prev.length + 1,
        title: "New Job Listing",
        postedDate: new Date().toISOString(),
        ...newJob,
      } as Job,
      ...prev,
    ]);
  };

  const addRental = (newRental: Partial<Rental>) => {
    setRentals((prev) => [
      {
        id: prev.length + 1,
        title: "New Rental Property",
        postedDate: new Date().toISOString(),
        ...newRental,
      } as Rental,
      ...prev,
    ]);
  };

  const addBloodRequest = (newRequest: BloodRequest) => {
    const id = bloodRequests.length + 1;
    const requestWithId: BloodRequest = {
      id,
      date: new Date().toISOString(),
      ...newRequest,
    };

    setBloodRequests((prev) => [requestWithId, ...prev]);

    // Broadcast a high severity Alert
    const emergencyAlert: Alert = {
      id: Date.now(),
      title: `URGENT BLOOD REQUIRED: ${newRequest.bloodGroup} at ${newRequest.hospitalName}`,
      description: `Patient ${newRequest.patientName} urgently requires ${newRequest.bloodGroup} blood at ${newRequest.hospitalName}. Please contact: ${newRequest.contactNumber}.`,
      category: "Civic Notices",
      severity: "urgent",
      affectedWards: "All",
      date: new Date().toISOString(),
    };
    setAlerts((prev) => [emergencyAlert, ...prev]);

    // Create a pinned community post
    const emergencyPost: Post = {
      id: Date.now() + 1,
      authorName: "EMERGENCY BROADCAST",
      authorAvatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60",
      ward: userProfile.wardNumber || 14,
      text: `🩸 URGENT BLOOD REQUEST 🩸\n\nPatient Name: ${newRequest.patientName}\nBlood Group Required: ${newRequest.bloodGroup}\nHospital: ${newRequest.hospitalName}\nContact Info: ${newRequest.contactNumber}\n\nPlease share this in your circles or reach out directly if you can donate!`,
      imageUrl: null,
      timestamp: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      isEmergency: true,
      comments: [],
    };
    setPosts((prev) => [emergencyPost, ...prev]);
  };

  const dismissAlert = (alertId: number | string) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
  };

  const markAlertAsRead = (alertId: number | string) => {
    if (!readAlerts.includes(alertId)) {
      setReadAlerts((prev) => [...prev, alertId]);
    }
  };

  const addService = (newService: Partial<Service>): Service => {
    const createdService: Service = {
      id: Date.now(),
      name: "Local Service Provider",
      rating: 5.0,
      verified: true,
      ward: Number(newService.ward || userProfile.wardNumber || 14),
      ...newService,
    };
    setServices((prev) => [createdService, ...prev]);
    return createdService;
  };

  return (
    <WardContext.Provider
      value={{
        wards: wards || [],
        userProfile,
        hasOnboarded,
        complaints,
        posts,
        alerts,
        volunteers,
        rentals,
        jobs,
        donations,
        services,
        bloodRequests,
        dismissedAlerts,
        readAlerts,
        activeWard,
        selectWard,
        completeOnboarding,
        updateProfile,
        resetOnboarding,
        addComplaint,
        upvoteComplaint,
        addPost,
        likePost,
        addCommentToPost,
        addVolunteer,
        addJob,
        addRental,
        addService,
        addBloodRequest,
        dismissAlert,
        markAlertAsRead,
      }}
    >
      {children}
    </WardContext.Provider>
  );
};

export const useWard = (): WardContextType => {
  const context = useContext(WardContext);
  if (!context) {
    throw new Error("useWard must be used within a WardProvider");
  }
  return context;
};
