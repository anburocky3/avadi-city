import { Suspense } from "react";
import type { Metadata } from "next";
import { initialFoodSpots } from "@/data/foodSpots";
import { SkeletonLoader } from "@/components/shared-components";
import { FoodClient } from "@/features/food-and-dining/components/food-and-dining-client";
import type { FoodSpot } from "@/features/food-and-dining/types";
import { getApprovedFoodListings } from "@/features/food-and-dining/services/food.service";

export const revalidate = 0;
export const metadata: Metadata = {
  title: "Food and Dining in Avadi",
  description:
    "Discover restaurants, cafes, and trusted local food spots across Avadi.",
};

export default async function FoodPage() {
  let approvedDbSpots: FoodSpot[] = [];

  try {
    approvedDbSpots = await getApprovedFoodListings();
  } catch (error) {
    console.error("Failed to load approved food listings from database:", error);
  }

  const spots: FoodSpot[] = [
    ...approvedDbSpots,
    ...(initialFoodSpots as FoodSpot[]),
  ];

  return (
    <Suspense
      fallback={
        <div className="p-4 md:p-6 max-w-4xl md:max-w-full mx-auto space-y-5">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <SkeletonLoader type="card" count={3} />
        </div>
      }
    >
      <FoodClient initialSpots={spots} />
    </Suspense>
  );
}
