export interface Alert {
  id: string | number;
  title: string;
  description: string;
  category: string;
  severity: "urgent" | "maintenance" | "info" | string;
  affectedWards: "All" | number[] | string[];
  date: string | number | Date;
  [key: string]: any;
}

export interface ClaimNotification {
  id: string;
  lostFoundItemId: string;
  message: string;
  imageUrl?: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string };
  owner: { id: string; name: string };
  item: {
    id: string;
    itemId: string;
    title: string;
    type: "lost" | "found";
    category: string;
    imageUrl?: string | null;
    status: string;
  };
}

export interface RevealedPhone {
  name: string;
  phone: string;
}
