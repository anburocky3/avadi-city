import { Prisma } from "../generated/prisma/client"; // Replace with your actual client build location

export const seedPlaces: Prisma.ExplorePlaceUncheckedCreateInput[] = [
  {
    id: "cmw82b6kl00017sl81a06qzll",
    name: "Avadi Paruthipattu Lake Green Park",
    category: "Parks & Gardens",
    description:
      "Avadi Paruthipattu Lake Green Park (also known as the Avadi Eco-Park) is a major urban waterfront and eco-tourism park located in Ram Nagar, Paruthipattu, Avadi, Chennai. Developed from a restored waterbody by the Water Resources Department, it serves as both a recreation spot and a vital groundwater recharge source for the surrounding neighborhoods.",
    address:
      "Kamaraj Nagar 4th Main Rd, Ram Nagar, Kamaraj Nagar, Avadi, Tamil Nadu 600071",
    areaLandmark: "Kamaraj Nagar 4th Street",
    ward: 45,
    latitude: 13.102719090695896,
    longitude: 80.10586738586427,
    is24x7: false,
    openingTime: "5:00 AM",
    closingTime: "7:00 PM",
    entryFeeType: "Free Entry",
    entryFeeAmount: 0,
    imageUrl: "https://r2.dev",
    additionalImages: Prisma.JsonNull, // Uses Prisma's explicit Null value for JSON columns

    // These columns are native JSON fields in your schema, so pass arrays directly
    activities: [
      "Walking",
      "Jogging",
      "Relaxation",
      "Family Outing",
      "Children's Play Area",
      "Photography",
      "Bird Watching",
      "Outdoor Exercise",
    ],
    visitorTypes: [
      "Families",
      "Children",
      "Couples",
      "Individual Visitors",
      "Groups",
      "Tourists",
      "Students",
    ],
    facilities: [
      "Public Restrooms",
      "Drinking Water",
      "Seating Areas",
      "Lighting",
      "Wheelchair Access",
      "Children's Play Area",
      "Family Seating Area",
      "Public Transport Access",
    ],

    bestTimeToVisit: "Any Time / All Year",
    guidelines: null,
    phone: null,
    website: null,
    officialUrl: null,

    // FIX: Stringify this because it is configured as a String/Text column in your schema
    additionalDetails: JSON.stringify({
      activities: [
        "Walking",
        "Jogging",
        "Relaxation",
        "Family Outing",
        "Children's Play Area",
        "Photography",
        "Bird Watching",
        "Outdoor Exercise",
      ],
      visitorTypes: [
        "Families",
        "Children",
        "Couples",
        "Individual Visitors",
        "Groups",
        "Tourists",
        "Students",
      ],
      facilities: [
        "Public Restrooms",
        "Drinking Water",
        "Seating Areas",
        "Lighting",
        "Wheelchair Access",
        "Children's Play Area",
        "Family Seating Area",
        "Public Transport Access",
      ],
      areaLandmark: "Kamaraj Nagar 4th Street",
      officialUrl: null,
      bestTimeToVisit: "Any Time / All Year",
      guidelines: null,
    }),

    status: "APPROVED",
    ownerId: "cmw7qgmyv00015sl8k30p23df", // Safe scalar input via UncheckedCreateInput typing
    createdAt: new Date("2026-11-08T16:44:15.237Z"),
    updatedAt: new Date("2026-11-08T16:44:15.237Z"),
  },
];
