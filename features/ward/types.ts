import type { AuthUser } from "@/features/auth/types";

export type { AuthUser };

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
  complaintId?: string | null;
  complaint?: {
    id?: string;
    issueId: string;
    title: string;
    description: string;
    category: string;
    subCategory: string;
    status: string;
    address: string;
    lat: number;
    lng: number;
    upvotes: number;
  } | null;
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
  issueId?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AddComplaintInput {
  category: string;
  subCategory: string;
  streetName: string;
  userWard: number;
  incidentWard?: number;
  shareOnFeed: boolean;
  lat: number;
  lng: number;
  title: string;
  description: string;
  images?: File[];
}

export interface WardContextType {
  feeds: Feed[];
  isLoadingFeeds: boolean;
  refreshFeeds: () => Promise<void>;
  addFeed: (newFeed: Partial<Feed>) => Promise<boolean>;
  likeFeed: (feedId: string | number) => Promise<void>;
  addCommentToFeed: (feedId: string | number, commentText: string) => Promise<void>;
  complaints: Complaint[];
  addComplaint: (data: AddComplaintInput) => Promise<Complaint>;
  isLoadingComplaints: boolean;
  upvoteComplaint: (complaintId: string | number) => Promise<void>;
  volunteers: Array<{ name: string; [key: string]: any }>;
  addVolunteer: (newVolunteer: Partial<{ name: string; [key: string]: any }>) => Promise<boolean>;
  bloodGroup: string;
  addBloodRequest: (
    newRequest: Partial<{ name: string; bloodGroup: string; contact: string }>,
  ) => Promise<boolean>;
  getLocalServiceProfile: () => Promise<any>;
  registerLocalServiceProfile: (serviceData: any) => Promise<boolean>;
  activeWard: { id: number; name: string; hints?: string };
  userProfile: { name: string; wardNumber: number; avatar?: string };
  updateProfile: (updatedData: Partial<AuthUser>, avatarFile?: File | null) => Promise<void>;
  wards: Array<{ id: number; name: string }>;
  selectWard: (wardId: number | string) => void;
  alerts: any[];
  readAlerts: any[];
  dismissedAlerts: any[];
  authUser: AuthUser | null | undefined;
  isLoadingAuth: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<unknown>;
}
