export const suburbanTrains = [
  { id: 1, trainNo: "43002", route: "Avadi to Chennai Central", type: "Slow", time: "07:15", duration: "45m", platform: "3" },
  { id: 2, trainNo: "43802", route: "Tiruttani to Chennai Central (via Avadi)", type: "Fast", time: "07:35", duration: "32m", platform: "2" },
  { id: 3, trainNo: "43004", route: "Avadi to Chennai Central", type: "Slow", time: "07:50", duration: "45m", platform: "4" },
  { id: 4, trainNo: "43202", route: "Tiruvallur to Chennai Central (via Avadi)", type: "Slow", time: "08:10", duration: "40m", platform: "1" },
  { id: 5, trainNo: "43804", route: "Arakkonam to Chennai Central (via Avadi)", type: "Fast", time: "08:30", duration: "30m", platform: "2" },
  { id: 6, trainNo: "43006", route: "Avadi to Chennai Central", type: "Slow", time: "08:50", duration: "45m", platform: "3" },
  { id: 7, trainNo: "43008", route: "Avadi to Chennai Central", type: "Slow", time: "09:20", duration: "45m", platform: "4" }
];

export const mtcBuses = [
  { id: 1, routeNo: "71E", from: "Avadi", to: "Broadway", stops: "Depot, Ambattur OT, Padi, ICF, Perambur, Central" },
  { id: 2, routeNo: "70", from: "Avadi", to: "Tambaram", stops: "Depot, Paruthipattu, Poonamallee, Porur, Perungalathur" },
  { id: 3, routeNo: "271B", from: "Avadi", to: "Koyambedu (CMBT)", stops: "Depot, Thirumullaivoyal, Ambattur OT, Padi, Koyambedu" },
  { id: 4, routeNo: "65A", from: "Avadi", to: "Poonamallee", stops: "Depot, Paruthipattu, Govardhanagiri, Senneerkuppam" },
  { id: 5, routeNo: "40H", from: "Pattabiram", to: "Anna Nagar West", stops: "Hindu College, Avadi Depot, Ambattur OT, Padi, Anna Nagar" }
];

export const fuelStations = [
  { id: 1, name: "Indian Oil (IOCL) Bunk - Avadi Depot", distance: "0.8 km", fuelTypes: ["Petrol", "Diesel", "CNG"], open24x7: true, ward: 16 },
  { id: 2, name: "Bharat Petroleum (BPCL) - CTH Road", distance: "1.2 km", fuelTypes: ["Petrol", "Diesel"], open24x7: false, ward: 20 },
  { id: 3, name: "Shell Fuel Station - Thirumullaivoyal", distance: "2.5 km", fuelTypes: ["Petrol", "Diesel", "V-Power"], open24x7: true, ward: 24 },
  { id: 4, name: "HP Fuel Station - Pattabiram", distance: "3.1 km", fuelTypes: ["Petrol", "Diesel", "CNG"], open24x7: false, ward: 2 }
];
