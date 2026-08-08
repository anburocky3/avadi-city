import { UserCheck } from "lucide-react";
import { useWard } from "@/context/wardContext";
import { wardMembersData } from "@/data/wards/wardMemberListData";
import { OfficialAdminData } from "@/data/officialsData";

export function useWardAdminProfile(): OfficialAdminData {
  const { activeWard } = useWard();

  const wardMember = wardMembersData.find(
    (member) => Number(member.id) === activeWard?.id,
  );

  if (!wardMember) {
    return {
      title: "Ward Administration",
      role: "Ward Admin Officer",
      name: "Not Available",
      avatar: "",
      department: "",
      jurisdiction: "",
      phone: "",
      email: "",
      office: "",
      timings: "Mon - Sat: 9:00 AM - 6:00 PM",
      badgeBg: "from-blue-600 to-indigo-700",
      icon: UserCheck,
    };
  }

  return {
    title: `${wardMember.ward} Administration`,
    role: `${wardMember.ward} Councillor`,
    name: wardMember.name,
    avatar: wardMember.avatar,
    department: wardMember.ward,
    jurisdiction: `${wardMember.ward} Boundary Limits`,
    phone: wardMember.phone,
    email: "",
    // email: `ward${wardMember.id}@avadicorporation.gov.in`,
    office: wardMember.address,
    timings: "Mon - Sat: 9:00 AM - 6:00 PM",
    badgeBg: "from-blue-600 to-indigo-700",
    icon: UserCheck,
  };
}
