import { JobVacancy } from "@/app/(auth)/jobs/jobs-client";

export const initialJobsData: JobVacancy[] = [
  {
    id: "job-1",
    role: "Billing Executive & Store Cashier",
    businessName: "Sri Balaji Supermarket",
    jobType: "Full-Time",
    postedTime: "Today",
    salary: "₹12,000 - ₹15,000 / month",
    location: "CTH Road, Near Bus Stand, Avadi (Ward 22)",
    shift: "9:00 AM - 8:00 PM",
    contact: "9876543210",
    ward: 22,
    details:
      "10th / 12th Pass required. Basic computer & barcode scanner knowledge needed.",
    requirements: [
      "10th / 12th Pass qualification",
      "Basic computer & billing software knowledge",
      "Day shift (9:00 AM - 8:00 PM)",
    ],
  },
  {
    id: "job-2",
    role: "Pharmacy Assistant & Counter Sales",
    businessName: "Apollo Pharmacy Outlet",
    jobType: "Full-Time",
    postedTime: "Yesterday",
    salary: "₹14,000 - ₹18,000 / month",
    location: "NM Road, Avadi (Ward 15)",
    shift: "Rotational Shifts",
    contact: "9840012345",
    ward: 15,
    details:
      "D.Pharm or B.Pharm preferred. Freshers with medical store experience can apply.",
    requirements: [
      "D.Pharm / B.Pharm or Medical Sales experience",
      "Medicine reading skills",
      "Rotational shifts with incentive",
    ],
  },
  {
    id: "job-3",
    role: "Delivery Executive (Bike Required)",
    businessName: "Avadi Local Express Logistics",
    jobType: "Part-Time",
    postedTime: "2 days ago",
    salary: "₹8,000 + Per Order Petrol Allowance",
    location: "Kamaraj Nagar, Avadi (Ward 14)",
    shift: "5:00 PM - 10:00 PM",
    contact: "9710088899",
    ward: 14,
    details:
      "Valid driving license and personal two-wheeler mandatory. Local area knowledge preferred.",
    requirements: [
      "Valid Driving License & Bike",
      "Android Smartphone",
      "Evening Part-time shift",
    ],
  },
];
