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
  [key: string]: any; // Allow additional properties
}
