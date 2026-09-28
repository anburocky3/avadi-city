/**
 * Smart Discovery helpers for Food & Dining module:
 * 1. Smart Search priority scoring
 * 2. Open Now / Closed status (including overnight and late-night logic)
 */

export interface FoodSpotLike {
  id: string | number;
  name: string;
  specialty?: string;
  description?: string;
  category?: string;
  foodType?: string;
  isVeg?: boolean;
  isLateNight?: boolean;
  timing?: string;
  openingTime?: string | null;
  closingTime?: string | null;
  lateNightStartTime?: string | null;
  lateNightEndTime?: string | null;
  address?: string;
  ward?: number;
  menu?: Array<{ name: string; price?: number; isVeg?: boolean }>;
  popularItems?: string[];
}

/**
 * Parses time strings like "9:00 AM", "10:30 PM", "6 PM", "2 AM" into minutes from midnight (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3].toLowerCase();

  if (period === "pm" && hours < 12) hours += 12;
  if (period === "am" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Checks whether a food spot is currently open based on openingTime, closingTime,
 * timing string, and late-night fields, correctly handling overnight hours.
 */
export function isShopOpenNow(spot: FoodSpotLike, currentDate = new Date()): boolean {
  const timingCombined = `${spot.openingTime || ""} ${spot.closingTime || ""} ${spot.timing || ""}`.toLowerCase();

  // 24 hours detection
  if (
    timingCombined.includes("24 hour") ||
    timingCombined.includes("24x7") ||
    timingCombined.includes("24/7") ||
    timingCombined.includes("all day")
  ) {
    return true;
  }

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  let startMin: number | null = null;
  let endMin: number | null = null;

  if (spot.openingTime) startMin = parseTimeToMinutes(spot.openingTime);
  if (spot.closingTime) endMin = parseTimeToMinutes(spot.closingTime);

  // If openingTime/closingTime not directly provided, extract from timing string (e.g. "6:30 AM – 10:30 PM")
  if ((startMin === null || endMin === null) && spot.timing) {
    const parts = spot.timing.split(/–|-|to/i);
    if (parts.length >= 2) {
      if (startMin === null) startMin = parseTimeToMinutes(parts[0]);
      if (endMin === null) endMin = parseTimeToMinutes(parts[1]);
    }
  }

  // Regular hours evaluation
  let isRegularOpen = false;
  if (startMin !== null && endMin !== null) {
    if (startMin <= endMin) {
      // Normal daytime hours (e.g. 9:00 AM [540] to 10:00 PM [1320])
      isRegularOpen = currentMinutes >= startMin && currentMinutes <= endMin;
    } else {
      // Overnight hours (e.g. 10:00 PM [1320] to 2:00 AM [120])
      // Open if current >= 1320 (e.g. 11 PM) OR current <= 120 (e.g. 1 AM)
      isRegularOpen = currentMinutes >= startMin || currentMinutes <= endMin;
    }
  }

  // Late-night hours evaluation
  let isLateNightOpen = false;
  if (spot.isLateNight) {
    const lnStart = spot.lateNightStartTime
      ? parseTimeToMinutes(spot.lateNightStartTime)
      : parseTimeToMinutes("10:00 PM");
    const lnEnd = spot.lateNightEndTime
      ? parseTimeToMinutes(spot.lateNightEndTime)
      : parseTimeToMinutes("3:00 AM");

    if (lnStart !== null && lnEnd !== null) {
      if (lnStart <= lnEnd) {
        isLateNightOpen = currentMinutes >= lnStart && currentMinutes <= lnEnd;
      } else {
        isLateNightOpen = currentMinutes >= lnStart || currentMinutes <= lnEnd;
      }
    } else {
      // Fallback for late-night hub if times not specified: 10:00 PM (1320) to 3:00 AM (180)
      isLateNightOpen = currentMinutes >= 22 * 60 || currentMinutes <= 3 * 60;
    }
  }

  return isRegularOpen || isLateNightOpen;
}

/**
 * Calculates a search priority match score for Smart Search.
 * Returns > 0 if matched (higher = higher priority in search results), 0 if no match.
 *
 * Priorities:
 * 1. Exact / prefix shop-name match (1000 / 900 / 800)
 * 2. Popular-item or menu-item match (700)
 * 3. Cuisine / specialty match (600)
 * 4. Dietary match (550)
 * 5. Category match (500)
 * 6. Location / ward match (400)
 * 7. Description match (300)
 */
export function getSearchMatchScore(spot: FoodSpotLike, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return 0;

  const name = (spot.name || "").toLowerCase();
  const specialty = (spot.specialty || "").toLowerCase();
  const category = (spot.category || "").toLowerCase();
  const foodType = (spot.foodType || "").toLowerCase();
  const address = (spot.address || "").toLowerCase();
  const description = (spot.description || "").toLowerCase();
  const wardStr = spot.ward ? `ward ${spot.ward}` : "";

  // Collect menu item names and popular items
  const menuItems = (spot.menu || []).map((m) => m.name.toLowerCase());
  const popularItems = (spot.popularItems || []).map((p) => String(p).toLowerCase());

  // 1. Shop name match
  if (name === q) return 1000; // Exact match
  if (name.startsWith(q)) return 900;
  if (name.includes(q)) return 800;

  // 2. Popular item or menu item match (handles partial e.g. "chick" -> "Chicken Biryani")
  const hasPopularMatch = popularItems.some((item) => item.includes(q));
  const hasMenuMatch = menuItems.some((item) => item.includes(q));
  if (hasPopularMatch || hasMenuMatch) return 700;

  // 3. Cuisine / specialty match
  if (specialty.includes(q)) return 600;

  // 4. Dietary option match (e.g. "veg", "vegetarian", "non-veg")
  const isVegQuery = q === "veg" || q === "vegetarian" || q.includes("veg");
  const isNonVegQuery = q === "non-veg" || q === "non veg" || q.includes("non-veg");

  if (isVegQuery && (spot.isVeg === true || foodType.includes("veg") || category.includes("veg"))) {
    return 550;
  }
  if (isNonVegQuery && (spot.isVeg === false || foodType.includes("non-veg") || category.includes("non-veg"))) {
    return 550;
  }
  if (foodType.includes(q)) return 550;

  // 5. Category match
  if (category.includes(q)) return 500;

  // 6. Location / ward match (e.g. "Paruthipattu", "Ward 12", "12")
  if (address.includes(q) || (wardStr && wardStr.includes(q)) || (spot.ward && spot.ward.toString() === q)) {
    return 400;
  }

  // 7. Description match
  if (description.includes(q)) return 300;

  return 0;
}
