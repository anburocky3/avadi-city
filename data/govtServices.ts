import { GovtServiceItem } from "@/app/(auth)/govt-services/govt-services-client";

export const initialGovtServicesData: GovtServiceItem[] = [
  {
    id: "prop-tax",
    title: "Property & Water Tax Online Payment",
    dept: "Avadi Municipal Corporation (TN Urban e-Pay)",
    category: "Tax & Utility",
    link: "https://www.tnurbanepay.tn.gov.in",
    desc: "Pay annual property tax, water supply charges, drainage & professional tax online. View payment history and download official receipts instantly.",
    badge: "Tax e-Pay",
    badgeBg:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    iconName: "CreditCard",
  },
  {
    id: "tneb",
    title: "TANGEDCO Electricity Bill Payment & Helpline",
    dept: "Tamil Nadu Electricity Board (TNEB)",
    category: "Tax & Utility",
    link: "https://www.tangedco.gov.in",
    desc: "Pay monthly EB electricity bills online, check tariff calculators, register power outage complaints, and request new service connections.",
    badge: "EB Power",
    badgeBg:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    iconName: "Zap",
  },
  {
    id: "esevai",
    title: "TN e-Sevai Revenue Certificates Portal",
    dept: "TNeGA — Government of Tamil Nadu",
    category: "Certificates",
    link: "https://www.tnesevai.tn.gov.in",
    desc: "Apply online for Community Certificate, Income Certificate, Native/Residence Certificate, First Graduate, and Solvency Certificates.",
    badge: "e-Sevai",
    badgeBg:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    iconName: "Award",
  },
  {
    id: "birth-death",
    title: "Birth & Death Certificate Download",
    dept: "Avadi Corporation Public Health Department",
    category: "Civil Registry",
    link: "https://www.tnurbanepay.tn.gov.in",
    desc: "Search, verify and download official digitally signed birth and death certificates registered within Avadi Corporation jurisdiction.",
    badge: "Civil Registry",
    badgeBg:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    iconName: "FileText",
  },
  {
    id: "rto-avadi",
    title: "Parivahan RTO Vehicle & DL e-Services",
    dept: "Ministry of Road Transport & RTO Avadi (TN-12)",
    category: "Transport & RTO",
    link: "https://parivahan.gov.in",
    desc: "Apply for Learner License (LLR), Driving License renewal, Vehicle Registration RC duplicate/transfer, and road tax payments.",
    badge: "RTO TN-12",
    badgeBg:
      "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    iconName: "Car",
  },
  {
    id: "building-sanction",
    title: "Building Plan Approval & Layout Sanction",
    dept: "Avadi Corporation Town Planning & CMDA",
    category: "Tax & Utility",
    link: "https://onlinebrs.tn.gov.in",
    desc: "Submit single-window building plan applications, track NOC status, and download approved building plan permits online.",
    badge: "Town Planning",
    badgeBg:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    iconName: "Landmark",
  },
  {
    id: "metro-water",
    title: "New Water & Sewerage Connection Portal",
    dept: "Avadi Corporation Water Supply & CMWSSB",
    category: "Tax & Utility",
    link: "https://chennaimetrowater.tn.gov.in",
    desc: "Apply online for new residential water supply connection, septic tank clearance booking, and underground sewerage connections.",
    badge: "Water Works",
    badgeBg:
      "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    iconName: "Droplet",
  },
  {
    id: "aadhaar-voter",
    title: "Aadhaar & Voter ID e-Services Portal",
    dept: "UIDAI & Election Commission of India (ECI)",
    category: "Certificates",
    link: "https://myaadhaar.uidai.gov.in",
    desc: "Update Aadhaar address, download e-Aadhaar PDF, link mobile number, apply for new Voter ID card & search electoral roll name.",
    badge: "National ID",
    badgeBg:
      "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    iconName: "ShieldCheck",
  },
];
