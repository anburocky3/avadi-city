import { prisma } from "@/lib/prisma";
import type { FoodSpot } from "@/features/food-and-dining/types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=60";

export async function getApprovedFoodListings(): Promise<FoodSpot[]> {
  const [listings, reviewStats] = await Promise.all([
    prisma.foodListing.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.foodReview.groupBy({
      by: ["shopId"],
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);
  const reviewMap = new Map(
    reviewStats.map((stats) => [
      stats.shopId,
      {
        rating:
          stats._avg.rating === null
            ? null
            : Number(stats._avg.rating.toFixed(1)),
        count: stats._count.id,
      },
    ]),
  );

  return listings.map((listing): FoodSpot => {
    let metadata: Record<string, unknown> = {};
    if (listing.additionalDetails) {
      try {
        const parsed: unknown = JSON.parse(listing.additionalDetails);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          metadata = parsed as Record<string, unknown>;
        }
      } catch {
        metadata = {};
      }
    }

    const reviews = reviewMap.get(listing.id);
    const popularItems = metadata.popularItems;
    const cuisines = metadata.cuisines;
    const isLateNight = metadata.isLateNight;
    const lateNightStartTime = metadata.lateNightStartTime;
    const lateNightEndTime = metadata.lateNightEndTime;

    return {
      id: listing.id,
      name: listing.name,
      specialty: listing.category,
      description: listing.description,
      imageUrl: listing.imageUrl || FALLBACK_IMAGE,
      rating: reviews?.rating ?? null,
      reviewCount: reviews?.count ?? 0,
      ward: listing.ward,
      foodType: listing.foodType || "Both Veg & Non-Veg",
      isVeg:
        listing.foodType === "Pure Veg" || listing.category === "Vegetarian",
      isLateNight:
        typeof isLateNight === "boolean"
          ? isLateNight
          : Boolean(
              listing.closingTime?.toLowerCase().includes("midnight") ||
                listing.closingTime?.toLowerCase().includes("am"),
            ),
      openingTime: listing.openingTime,
      closingTime: listing.closingTime,
      lateNightStartTime:
        typeof lateNightStartTime === "string" ? lateNightStartTime : null,
      lateNightEndTime:
        typeof lateNightEndTime === "string" ? lateNightEndTime : null,
      timing:
        [listing.openingTime, listing.closingTime]
          .filter(Boolean)
          .join(" – ") || "Open Today",
      address: listing.address,
      phone: listing.phone,
      category: listing.category,
      status: listing.status,
      popularItems: Array.isArray(popularItems)
        ? popularItems.filter((item): item is string => typeof item === "string")
        : [],
      cuisines: typeof cuisines === "string" ? cuisines : undefined,
    };
  });
}
