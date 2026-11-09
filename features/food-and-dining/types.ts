export interface MenuItem {
  name: string;
  price: number;
  isVeg?: boolean;
}

export interface FoodSpot {
  id: string | number;
  name: string;
  specialty: string;
  description: string;
  imageUrl: string;
  rating?: number | null;
  reviewCount?: number;
  ward: number;
  foodType: "Veg" | "Non-Veg" | "Ice Cream" | string;
  isVeg?: boolean;
  isLateNight?: boolean;
  timing?: string;
  openingTime?: string | null;
  closingTime?: string | null;
  lateNightStartTime?: string | null;
  lateNightEndTime?: string | null;
  address?: string;
  phone?: string;
  category?: string;
  status?: string;
  menu?: MenuItem[];
  popularItems?: string[];
  cuisines?: string;
}

export interface FoodReviewItem {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  updatedAt: string;
  isOwn?: boolean;
}

export interface FilterFoodCategory {
  id: string;
  name: string;
  renderIcon: () => React.ReactNode;
}
