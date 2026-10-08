export const wards = Array.from({ length: 48 }, (_, i) => {
  const id = i + 1;
  // Distribute realistic Avadi areas across the 48 wards
  let name = "";
  let hints = "";
  
  if (id === 1) { name = "Pattabiram West"; hints = "Kaveri Nagar, Deena Dayalan Nagar, Station Road"; }
  else if (id === 2) { name = "Pattabiram East"; hints = "Saraswathi Nagar, Kakkanji Nagar, Overbridge"; }
  else if (id === 3) { name = "Thandarai"; hints = "Anna Nagar, Thandarai Village, Main Road"; }
  else if (id === 4) { name = "Mittanamalli"; hints = "Defense Enclave, Outer Ring Road, Gokul Nagar"; }
  else if (id === 5) { name = "Muthapudupet IAF"; hints = "IAF Area, Air Force Station, Kendriya Vidyalaya"; }
  else if (id === 6) { name = "JB Nagar"; hints = "JB Nagar Main Road, Palakkad Road, JB school"; }
  else if (id === 7) { name = "Kovilpadagai West"; hints = "Poompozhil Nagar, Kovilpadagai Lake, Murugan Temple"; }
  else if (id === 8) { name = "Kovilpadagai East"; hints = "Kalaignar Nagar, Deenadayalan Street, Lake View"; }
  else if (id === 9) { name = "Sekkadu West"; hints = "Giri Nagar, Sekkadu High Road, Pillayar Kovil"; }
  else if (id === 10) { name = "Sekkadu East"; hints = "Kamrajapuram, Hospital Road, Murugan Temple"; }
  else if (id === 11) { name = "Paruthipattu Lake Area"; hints = "Paruthipattu Lake Park, Lake View Road, Green Gardens"; }
  else if (id === 12) { name = "Paruthipattu PH Road"; hints = "Poonamallee High Road, St. Peter's College, Bus Stop"; }
  else if (id === 13) { name = "Senneerkuppam"; hints = "Poonamallee Bypass, Senneerkuppam Junction"; }
  else if (id === 14) { name = "Karayanchavadi"; hints = "KVP Garden, High School Road, Mosque Street"; }
  else if (id === 15) { name = "Kumananchavadi"; hints = "Service Road, Poonamallee Road, Kumananchavadi Jn"; }
  else if (id === 16) { name = "Avadi Depot Road"; hints = "Avadi Bus Depot, Depot Road, Post Office"; }
  else if (id === 17) { name = "Avadi Bazaar"; hints = "Jawahar Bazar, Market Street, Gandhi Statue"; }
  else if (id === 18) { name = "Gandhi Nagar"; hints = "Anna Street, Gandhi Nagar, Kamaraj Salai"; }
  else if (id === 19) { name = "Kamaraj Nagar West"; hints = "HVF Estate Road, TNHB Gate, Government School"; }
  else if (id === 20) { name = "Kamaraj Nagar East"; hints = "TNHB Colony, Kamaraj Nagar Main Road, Parks"; }
  else if (id === 21) { name = "HVF Road Quarters"; hints = "Heavy Vehicles Factory Quarters, HVF Road, KV School"; }
  else if (id === 22) { name = "HVF Estate South"; hints = "HVF South Gate, Estate Park, Main Playground"; }
  else if (id === 23) { name = "Cholambedu Giri Nagar"; hints = "Giri Nagar, Cholambedu Road, Pillayar Kovil Street"; }
  else if (id === 24) { name = "Cholambedu Road"; hints = "Cholambedu Main Road, Railway Crossing, Junction"; }
  else if (id === 25) { name = "Thirumullaivoyal West"; hints = "Pachaiamman Nagar, Pacchaiamman Temple, Canal Road"; }
  else if (id === 26) { name = "Thirumullaivoyal Vellanur"; hints = "Vellanur Road, Sathyamoorthy Nagar, Government School"; }
  else if (id === 27) { name = "Thirumullaivoyal Center"; hints = "Shanthi Nagar, MGR Statue, Bus Stand"; }
  else if (id === 28) { name = "Thirumullaivoyal Senthil"; hints = "Senthil Nagar, Pachaiamman Kovil Street, Arch"; }
  else if (id === 29) { name = "Ambattur OT Road"; hints = "OT Road, Ambattur OT Junction, Bus Stand"; }
  else if (id === 30) { name = "Menambedu Lake Area"; hints = "Menambedu Lake View, Lake Enclave, Park Road"; }
  else if (id === 31) { name = "Oragadam"; hints = "Church Street, Oragadam Road, CSI School"; }
  else if (id === 32) { name = "Venkatapuram"; hints = "Station Road, Venkatapuram, Vinayagar Temple"; }
  else if (id === 33) { name = "Vijayalakshmipuram"; hints = "Perumal Koil Street, Ambattur Road, Market Street"; }
  else if (id === 34) { name = "Avadi Checkpost"; hints = "Redhills Road, Avadi Checkpost, Police Station"; }
  else if (id === 35) { name = "Thirumullaivoyal North"; hints = "Bharathi Nagar, Thirumullaivoyal Railway Station"; }
  else if (id === 36) { name = "Vaishnavi Nagar"; hints = "Vaishnavi Nagar Main Road, Murugan Temple, Parks"; }
  else if (id === 37) { name = "Mittanamalli Gokul"; hints = "Gokul Nagar, Defense Enclave road, Lake Road"; }
  else if (id === 38) { name = "Muthapudupet East"; hints = "Srinivasa Nagar, Muthapudupet Junction, Market"; }
  else if (id === 39) { name = "Pattabiram Cholan Nagar"; hints = "Cholan Nagar, Outer Ring Road, Hindu College Station"; }
  else if (id === 40) { name = "Pattabiram Gopalapuram"; hints = "Gopalapuram, Pattabiram Depot Road, Middle School"; }
  else if (id === 41) { name = "Sekkadu Road"; hints = "Bharathiar Street, Sekkadu Bypass, Toll Gate"; }
  else if (id === 42) { name = "JB Nagar South"; hints = "Anna Salai, JB Nagar Block B, Play Area"; }
  else if (id === 43) { name = "Avadi Station Quarters"; hints = "Avadi Railway Station, Station Quarters, Railway Subway"; }
  else if (id === 44) { name = "Kovilpadagai Village"; hints = "Vellala Street, Kovilpadagai Road, Old Village"; }
  else if (id === 45) { name = "Paruthipattu Ayya Nagar"; hints = "Ayya Nagar, Paruthipattu Lake Arch, School Street"; }
  else if (id === 46) { name = "Karayanchavadi Junction"; hints = "Poonamallee Main Road, High School Ground"; }
  else if (id === 47) { name = "Cholambedu Balaji"; hints = "Balaji Nagar, Cholambedu Lake View, Park Street"; }
  else { name = "Thirumullaivoyal East"; hints = "Eswaran Koil Street, Thirumullaivoyal Village"; }

  return { id, name, hints };
});
