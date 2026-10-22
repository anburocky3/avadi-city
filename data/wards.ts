/**
 * Avadi Corporation - Official 48 Wards
 * Area names derived from avadi-wards.json real street data.
 * DO NOT use dummy names like "Poonamallee Bypass" — all hints must be Avadi localities.
 */

export interface Ward {
  id: number;
  name: string;
  hints: string;
}

export const wards: Ward[] = [
  { id: 1,  name: "Muthapudupet",           hints: "Ellathan Nagar, Karimedu, Bharathi Nagar" },
  { id: 2,  name: "Muthapudupet West",       hints: "Michael Cross Street, Ambedkar St, Muthapudupet" },
  { id: 3,  name: "Mittanamallee",           hints: "Alamen Nagar, Ambedkar St Main Salai, Mittanamallee" },
  { id: 4,  name: "Muthapudhupet South",     hints: "Abdul Kalam Street, Bethel Street, Muthapudhupet" },
  { id: 5,  name: "Rajiv Gandhi Nagar",      hints: "Brindavan Nagar, CRPF Road, Rajiv Gandhi Nagar" },
  { id: 6,  name: "Ashok Nagar",             hints: "Balaji Nagar, R R Nagar, Koilpadagai" },
  { id: 7,  name: "Thirumullaivoyal North",  hints: "Thirumullaivoyal, T.M. Voyal, Main Road" },
  { id: 8,  name: "Thirumullaivoyal West",   hints: "Aarthi Nagar, 3rd Main Road, T.M. Voyal" },
  { id: 9,  name: "Thirumullaivoyal East",   hints: "Saraswathi Nagar, Ambedkar Street, Amman Avenue" },
  { id: 10, name: "Thirumullaivoyal Central",hints: "T.M. Voyal Main Road, Thirumullaivoyal" },
  { id: 11, name: "Poompozhil Nagar",        hints: "Shanthi Nagar Extn, Poompuzhil Nagar" },
  { id: 12, name: "Koilpadagai",             hints: "Adiyapadhan Street, Anna Park Road, Annai Therasa Street" },
  { id: 13, name: "Avadi – HVF Road",        hints: "HVF Road, Murugappa College, Pattabiram" },
  { id: 14, name: "Anna Nagar, Pattabiram",  hints: "Anna Nagar, Power Line Street, Annanagar" },
  { id: 15, name: "Kakkanji Nagar",          hints: "Thanakila, Kakkanji Nagar, Pattabiram" },
  { id: 16, name: "Chattiram",               hints: "Chattiram, Bharathiyar Nagar, Pattabiram" },
  { id: 17, name: "Pattabiram Central",      hints: "Kamarajapuram, School Street, Pattabiram" },
  { id: 18, name: "Charles Nagar",           hints: "Gandhi Nagar, EB Station Main Road, Adhiparasakthi Nagar" },
  { id: 19, name: "Vallalar Nagar",          hints: "Thandurai, Gangai Amman Street, Vallalar Nagar" },
  { id: 20, name: "Thandurai",               hints: "VOC Street, Abdulkalam Street, Thandurai, Avadi" },
  { id: 21, name: "Senthamil Nagar",         hints: "Anna Nagar, Dhanalakshmi Nagar, Senthamil Nagar" },
  { id: 22, name: "Sindhu Nagar",            hints: "Gandhi Nagar, Sindhu Nagar, Anbalagan Street" },
  { id: 23, name: "Gandhinagar",             hints: "Gandhi Nagar, Avadi Corporation Area" },
  { id: 24, name: "T.M. Voyal South",        hints: "Jyothi Nagar, Anthony Nagar, T.M. Voyal" },
  { id: 25, name: "Vaishnavi Nagar",         hints: "Vaishnavi Nagar, Thirumullaivoyal" },
  { id: 26, name: "Cholan Nagar",            hints: "Nethaji Nagar, Shanthipuram, Cholambedu" },
  { id: 27, name: "Cholambedu",              hints: "Cholambedu, Thirumullaivoyal Main Road" },
  { id: 28, name: "T.M. Voyal Iyyappan Nagar", hints: "Iyyappan Nagar, Parthasarathy Street, T.M. Voyal" },
  { id: 29, name: "T.M. Voyal West",         hints: "Sathyamoorthy Street, Thirumullaivoyal West" },
  { id: 30, name: "Senthil Nagar",           hints: "Sri Nagar Colony, Senthil Nagar, Avadi" },
  { id: 31, name: "New Anna Nagar",          hints: "Annai Sathya Nagar, Periyar Nagar, New Anna Nagar" },
  { id: 32, name: "T.M. Voyal East",         hints: "T.M. Voyal, Thirumullaivoyal East" },
  { id: 33, name: "Jothi Nagar",             hints: "Jothi Nagar, Reddypalayam, Thirumullaivoyal" },
  { id: 34, name: "Jeeva Nagar",             hints: "Jeeva Nagar, Aadhiparasakthi Nagar, Avadi" },
  { id: 35, name: "Kannigapuram",            hints: "Annamalai Nagar, Arundhathipuram, Kannigapuram" },
  { id: 36, name: "Nandavanamettur",         hints: "Anna Nagar, Kalaivanar Street, Nandavanamettur" },
  { id: 37, name: "Sekkadu – Gopalapuram",   hints: "Gopalapuram, Sekkadu, 3rd Main Road" },
  { id: 38, name: "Sri Devi Nagar",          hints: "Kamaraj Nagar, Vivekanandha Main Road, Sri Devi Nagar" },
  { id: 39, name: "Kamaraj Nagar",           hints: "Ramalingapuram, Nehru Nagar, Kamaraj Nagar" },
  { id: 40, name: "Avadi A Division",        hints: "TNHB Colony, Avadi Town Area" },
  { id: 41, name: "TNHB Colony",             hints: "TNHB Ward 41, Agraharam Street, Avadi" },
  { id: 42, name: "J.B. Estate",             hints: "J.B. Estate, Shankar Nagar, Avadi" },
  { id: 43, name: "Vasantham Nagar",         hints: "AGD Nagar, Govarthanagiri, Vasantham Nagar" },
  { id: 44, name: "Kamaraj Nagar South",     hints: "Kamaraj Nagar, Kumaran Cross Street, Avadi" },
  { id: 45, name: "Ayyappan Nagar",          hints: "Ayyappan Nagar, Sekkadu Kamaraj Nagar" },
  { id: 46, name: "Ananda Nagar",            hints: "Lazar Nagar, Periyar Nagar, Ananda Nagar" },
  { id: 47, name: "Sri Ram Nagar",           hints: "Paruthipattu Colony, Sapthagiri Nagar, Sri Ram Nagar" },
  { id: 48, name: "Srinivasa Nagar",         hints: "Indira Nagar, Aravind Nagar, Srinivasa Nagar" },
];

/** Quick lookup: wardId → Ward */
export const WARD_MAP: Record<number, Ward> = Object.fromEntries(
  wards.map((w) => [w.id, w])
);

/** Returns ward name by id, fallback to "Ward N" */
export function getWardName(wardId: number): string {
  return WARD_MAP[wardId]?.name ?? `Ward ${wardId}`;
}

/** Returns ward hints/area description by id */
export function getWardHints(wardId: number): string {
  return WARD_MAP[wardId]?.hints ?? "Avadi Corporation";
}
