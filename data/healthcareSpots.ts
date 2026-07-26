import { HealthcareFacility } from "@/app/(auth)/healthcare/healthcare-client";

export const initialHealthcareSpots: HealthcareFacility[] = [
  {
    id: 1,
    name: "Avadi Government Base Hospital",
    category: "Hospitals",
    specialty: "General Medicine, Trauma & Emergency",
    description:
      "Primary municipal government hospital equipped with emergency trauma care, maternity ward, and round-the-clock medical officers.",
    address: "New Military Road, Near Avadi Bus Stand, Avadi, Chennai - 600054",
    imageUrl:
      "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2638 0255",
    ambulancePhone: "108",
    rating: 4.5,
    ward: 22,
    timings: "Open 24/7 (24 Hours Emergency)",
    is24x7: true,
    hasEmergencyUnit: true,
    services: [
      "24/7 Emergency Casualty",
      "Maternity & Childcare",
      "Free Outpatient Ward",
      "Blood Bank",
    ],
  },
  {
    id: 2,
    name: "KC Multispeciality Hospital",
    category: "Hospitals",
    specialty: "Cardiology, Orthopedics & Intensive Care",
    description:
      "Leading private multispeciality hospital in Avadi featuring ICU beds, advanced surgical theaters, and round-the-clock specialist care.",
    address: "CTH Road, Opp. Ordnance Factory, Avadi, Chennai - 600054",
    imageUrl:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2638 4444",
    ambulancePhone: "+91 98400 12345",
    rating: 4.8,
    ward: 39,
    timings: "Open 24/7",
    is24x7: true,
    hasEmergencyUnit: true,
    services: [
      "24x7 Trauma & ICU",
      "Digital X-Ray & CT Scan",
      "Emergency Surgery",
      "In-house Pharmacy",
    ],
  },
  {
    id: 3,
    name: "Sir Ivan Stedeford Hospital",
    category: "Hospitals",
    specialty: "General Surgery, Pediatrics & Gynecology",
    description:
      "Charitable trust hospital providing high-quality healthcare, surgery, and inpatient care at subsidized rates for local residents.",
    address: "Ambattur - Avadi Road, Sector 3, Ambattur OT, Chennai - 600053",
    imageUrl:
      "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2658 1234",
    rating: 4.7,
    ward: 41,
    timings: "Open 24/7 (OPD: 8:00 AM - 8:00 PM)",
    is24x7: true,
    hasEmergencyUnit: true,
    services: [
      "Dialysis Center",
      "Pediatric Care",
      "Full Body Checkups",
      "24/7 Pharmacy",
    ],
  },
  {
    id: 4,
    name: "Apollo Pharmacy 24x7 - CTH Road",
    category: "Pharmacies",
    specialty: "Medicines, Surgical Supplies & Health Supplements",
    description:
      "Official 24/7 Apollo Pharmacy outlet offering essential prescription drugs, OTC medicines, surgical goods, and doorstep delivery.",
    address: "No. 142, CTH Road, Near Avadi Railway Station, Avadi - 600054",
    imageUrl:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2638 9900",
    rating: 4.6,
    ward: 38,
    timings: "Open 24 Hours (Everyday)",
    is24x7: true,
    hasEmergencyUnit: false,
    services: [
      "24/7 Medicine Availability",
      "Home Delivery",
      "Cold Storage Vaccines",
    ],
  },
  {
    id: 5,
    name: "Dr. Mohan's Diabetes Specialities Centre",
    category: "Clinics",
    specialty: "Diabetology & Metabolic Care",
    description:
      "Renowned clinic specialized in comprehensive diabetes management, foot care, eye screening, and personalized dietary consultation.",
    address: "NM Road, Near Municipal Office, Avadi, Chennai - 600054",
    imageUrl:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2637 1111",
    rating: 4.6,
    ward: 15,
    timings: "Mon - Sat: 7:00 AM - 7:00 PM",
    is24x7: false,
    hasEmergencyUnit: false,
    services: [
      "HbA1c & Fasting Lab Tests",
      "Diabetic Foot Care",
      "Dietary Counseling",
    ],
  },
  {
    id: 6,
    name: "Medall Healthcare Diagnostics - Avadi Branch",
    category: "Diagnostics",
    specialty: "MRI, CT Scan, Pathology & Blood Tests",
    description:
      "NABL-accredited diagnostic laboratory providing blood investigations, ultrasound scans, ECG, and health screening packages.",
    address: "Gandhi Nagar Main Road, Near Shell Petrol Pump, Avadi - 600054",
    imageUrl:
      "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2638 8888",
    rating: 4.5,
    ward: 20,
    timings: "Mon - Sat: 6:30 AM - 9:00 PM | Sun: 7:00 AM - 2:00 PM",
    is24x7: false,
    hasEmergencyUnit: false,
    services: [
      "Home Sample Collection",
      "Digital X-Ray & Ultrasound",
      "Master Health Checkup",
      "Pathology Lab",
    ],
  },
  {
    id: 7,
    name: "MedPlus Pharmacy - Kamaraj Nagar",
    category: "Pharmacies",
    specialty: "Generic Medicines & Personal Care Products",
    description:
      "Trusted chain pharmacy outlet offering genuine medicines at discounted rates with digital prescription management.",
    address: "Main Trunk Road, Kamaraj Nagar, Avadi, Chennai - 600071",
    imageUrl:
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80",
    phone: "+91 44 2638 5566",
    rating: 4.4,
    ward: 39,
    timings: "7:00 AM - 11:00 PM",
    is24x7: false,
    hasEmergencyUnit: false,
    services: [
      "Discounted Prescriptions",
      "Order Pickup",
      "Health Care Products",
    ],
  },
];
