import { RentalProperty } from "@/types/rental";

/**
 * Resolves the primary category slug for clean URLs
 * - RENT: "rent"
 * - COMMERCIAL: "commercial"
 * - NON-COMMERCIAL: "non-commercial"
 * - PROPERTY FOR SALE: "property-for-sale" (or "sale")
 */
export function getPropertyCategorySlug(property: RentalProperty): string {
  if (
    property.transactionType === "Commercial" ||
    ["Shop", "Showroom", "Office", "Commercial Building", "Warehouse", "Restaurant"].includes(
      property.category,
    )
  ) {
    return "commercial";
  }

  if (
    property.transactionType === "PG / Hostel" ||
    ["Men's PG", "Women's PG", "Student Hostel", "Co-living"].includes(
      property.category,
    )
  ) {
    return "non-commercial";
  }

  if (
    property.transactionType === "Sale" ||
    property.category === "Plot / Land" ||
    property.propertyTypeTag?.toLowerCase().includes("sale") ||
    property.title?.toLowerCase().includes("sale")
  ) {
    return "property-for-sale";
  }

  return "rent";
}

/**
 * Parses a slug like "rent-cly12345" or "commercial-xyz" into category and property ID
 */
export function parsePropertySlug(slug: string): {
  categorySlug?: string;
  propertyId: string;
} {
  if (!slug) return { propertyId: "" };

  const knownPrefixes = [
    "non-commercial-",
    "property-for-sale-",
    "commercial-",
    "sale-",
    "rent-",
  ];

  for (const prefix of knownPrefixes) {
    if (slug.toLowerCase().startsWith(prefix)) {
      return {
        categorySlug: prefix.slice(0, -1),
        propertyId: slug.slice(prefix.length),
      };
    }
  }

  return { propertyId: slug };
}

/**
 * Returns the canonical share path for a property, e.g. "/rental/rent-cly123"
 */
export function getPropertySharePath(property: RentalProperty): string {
  const categorySlug = getPropertyCategorySlug(property);
  return `/rental/${categorySlug}-${property.id}`;
}
