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

  complaint?: {
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
