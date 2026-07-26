import { RentalProperty } from "@/app/(auth)/rentals/rental-client";

export const initialRentalsData: RentalProperty[] = [
  {
    id: "rent-1",
    title: "2BHK Independent House with Car Parking",
    type: "Residential",
    propertyTypeTag: "2BHK",
    rent: 12500,
    advance: 60000,
    contact: "9876543210",
    ownerName: "G. Shanmugam",
    location: "Kamaraj Nagar 2nd Street, Near Station (Ward 14)",
    ward: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=60",
    details:
      "Independent 1st floor house with 2 bedrooms, hall, kitchen, separate EB meter and 24/7 water supply.",
    features: ["24/7 Water", "Covered Car Parking", "3-Phase EB", "Balcony"],
  },
  {
    id: "rent-2",
    title: "Ground Floor Commercial Shop Space for Rent",
    type: "Commercial",
    propertyTypeTag: "Commercial Shop",
    rent: 18000,
    advance: 100000,
    contact: "9840012345",
    ownerName: "M. Venkatesan",
    location: "CTH Main Road, Opp. Ordnance Factory (Ward 39)",
    ward: 39,
    imageUrl:
      "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=600&auto=format&fit=crop&q=60",
    details:
      "Prime main road facing shop space suitable for pharmacy, mobile store, or grocery shop.",
    features: ["Main Road Facing", "Rolling Shutter", "Restroom"],
  },
  {
    id: "rent-3",
    title: "1BHK Portions for Small Family or Bachelors",
    type: "Residential",
    propertyTypeTag: "1BHK",
    rent: 7500,
    advance: 35000,
    contact: "9710088899",
    ownerName: "K. Rajendran",
    location: "Gandhi Nagar 4th Street, Avadi (Ward 20)",
    ward: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&auto=format&fit=crop&q=60",
    details:
      "Clean 1BHK ground floor portion with 24 hours borewell water and bike parking space.",
    features: ["Bike Parking", "Borewell Water", "Quiet Area"],
  },
];
