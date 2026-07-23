export const initialAlerts = [
  {
    id: 1,
    title: "Scheduled Power Shutdown: Wards 1 to 5",
    description: "TNEB has announced a scheduled maintenance shutdown on 18th July (Saturday) from 9:00 AM to 5:00 PM for substation upgrades. Areas affected include Pattabiram West, Pattabiram East, Thandarai, and Mittanamalli. Power is expected to be restored by 5:00 PM.",
    category: "TNEB/Power",
    severity: "maintenance",
    affectedWards: [1, 2, 3, 4, 5],
    date: "2026-07-16T10:00:00Z"
  },
  {
    id: 2,
    title: "Urgent: Water Supply Interruption in Thirumullaivoyal",
    description: "Due to emergency pipeline repair works near the main reservoir, drinking water supply will be completely suspended for Wards 25, 26, 27, and 28 on 17th July. Residents are requested to store adequate water and use it conservatively.",
    category: "Water Supply",
    severity: "urgent",
    affectedWards: [25, 26, 27, 28],
    date: "2026-07-16T15:20:00Z"
  },
  {
    id: 3,
    title: "Heavy Rainfall Warning: Red Alert for Chennai & Avadi",
    description: "Meteorological Department has issued a red alert warning for severe heavy rains in Tiruvallur district, including Avadi, for the next 24 hours. Residents are advised to stay indoors, avoid parking vehicles near old trees or poles, and contact the Avadi Corporation helpline (044-26342000) for emergencies.",
    category: "Weather",
    severity: "urgent",
    affectedWards: "All",
    date: "2026-07-16T12:00:00Z"
  },
  {
    id: 4,
    title: "Weekly Vaccination Drive at Primary Health Center",
    description: "Avadi Municipal Corporation is conducting a free vaccination and general health camp this Sunday (July 19) at the Karayanchavadi Primary Health Center. Time: 9:00 AM to 3:00 PM. General checkups, pediatric care, and boosters are available free of charge.",
    category: "Civic Notices",
    severity: "info",
    affectedWards: [12, 13, 14, 15, 16],
    date: "2026-07-15T08:00:00Z"
  },
  {
    id: 5,
    title: "Dengue Awareness Door-to-Door Inspection",
    description: "Health inspectors will be visiting houses in Kovilpadagai (Wards 7 and 8) starting tomorrow to inspect mosquito breeding and distribute Nilavembu Kudineer. Residents are requested to cooperate and clear open water containers.",
    category: "Civic Notices",
    severity: "info",
    affectedWards: [7, 8],
    date: "2026-07-14T09:30:00Z"
  }
];
