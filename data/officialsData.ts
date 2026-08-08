import { Building, Building2, Crown, LucideIcon, Zap } from "lucide-react";

// MLA should have political info but others are administrators with official contact details. This directory can be expanded as needed.
export interface OfficialAdminData {
  title: string;
  role: string;
  name: string;
  phone: string;
  email: string;
  office: string;
  timings: string;
  badgeBg: string;
  icon: LucideIcon | React.ElementType;
  avatar?: string;
  deputy?: {
    name: string;
    phone: string;
    avatar?: string;
  };
  mp?: {
    name: string;
    role: string;
    avatar?: string;
    party?: string;
    partyStyle?: string;
    jurisdiction?: string;
    phone?: string;
    email?: string;
  };
  party?: string;
  partyStyle?: string;
  department?: string;
  jurisdiction?: string;
}

export const OFFICIALS_DIRECTORY: Record<string, OfficialAdminData> = {
  mla: {
    title: "MLA of Avadi Constituency",
    role: "Avadi Constituency (MLA)",
    name: "Hon. R. Ramesh Kumar",
    avatar: "/img/officials/avadi-mla.jpg",
    mp: {
      name: "Hon. Sasikanth Senthil",
      role: "Member of Parliament (MP)",
      avatar: "/img/officials/avadi-mp.webp",
      party: "INC",
      partyStyle:
        "bg-gradient-to-r from-[#EE5A1C] via-[#FFFFFF] to-[#166A2F] text-black border border-amber-400/40 shadow-sm",
      jurisdiction: "Thiruvallur Parliamentary Constituency (TN-002)",
      phone: "+91 44 2638 5555",
      email: "mla.avadi@tn.gov.in",
    },
    party: "TVK",
    partyStyle:
      "bg-linear-to-r from-red-900 to-red-950 text-amber-300 border border-amber-400/40 shadow-sm",
    jurisdiction: "Avadi Assembly Constituency (TN-006)",
    phone: "+91 44 2638 5555",
    email: "mla.avadi@tn.gov.in",
    office: "Avadi MLA Constituency Office, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Sat: 10:00 AM - 6:00 PM",
    badgeBg: "from-emerald-600 to-teal-700",
    icon: Building,
  },
  mayor: {
    title: "Mayor of Avadi Corporation",
    role: "Mayor",
    name: "Thiru.G.Udhayakumar",
    avatar: "/img/officials/avadi-mayor.jpeg",
    deputy: {
      name: "Thiru.S.Suryakumar",
      phone: "+919382222323",
      avatar: "/img/officials/avadi-deputy-mayor.jpeg",
    },
    department: "Avadi Corporation Office",
    jurisdiction: "All 48 Wards · Avadi Corporation",
    phone: "+919710086560",
    email: "commr.avadi@tn.gov.in",
    office: "Avadi Corporation Building, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
    badgeBg: "from-amber-500 to-orange-600",
    icon: Building2,
  },
  commissioner: {
    title: "Corporation Commissioner",
    role: "Commissioner",
    name: "Tmt.R.SARANYA, IAS",
    avatar: "/img/officials/avadi-comissioner.jpeg",
    department: "Avadi Corporation Office",
    jurisdiction: "All 48 Wards · Avadi Corporation",
    phone: "+91 044-26554440",
    email: "commr.avadi@tn.gov.in",
    office: "Avadi Corporation Building, NM Road, Avadi, Chennai - 600054",
    timings: "Mon - Fri: 10:00 AM - 5:00 PM",
    badgeBg: "from-amber-500 to-orange-600",
    icon: Crown,
  },
  eb: {
    title: "TANGEDCO / EB Electricity Board",
    role: "Power & Electricity Utility",
    name: "Avadi EB Executive Engineer Office",
    department: "TANGEDCO West Zone",
    phone: "1912 / +91 44 2638 0111",
    email: "ae.eb.avadi@tnebltd.gov.in",
    office: "TNEB Sub-Station Office, CTH Road, Avadi, Chennai - 600054",
    timings: "24x7 Power Emergency / Helpline 1912",
    badgeBg: "from-yellow-500 to-amber-600",
    icon: Zap,
  },
  corporationHQ: {
    title: "Avadi Municipal Corporation Info",
    role: "Civic Head Office",
    name: "Grievance Redressal Point",
    department: "Public Grievance Cell",
    phone: "044-26554440",
    email: "commr.avadi@tn.gov.in",
    office:
      "Avadi Municipal Corporation Headquarters, New Military Road, Avadi - 600054",
    timings: "Mon - Sat: 9:00 AM - 5:30 PM (Toll-Free 24x7)",
    badgeBg: "from-cyan-600 to-blue-700",
    icon: Building2,
  },
};
