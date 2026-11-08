export const adminUsers = [
  {
    id: "admin_1",
    name: "Super Admin",
    email: "admin@avadi.city",
    role: "ADMIN", // Assuming you have a role field
    phone: "9111111111",
    wardNumber: 14,
    // ... rest of your required fields
  },
];

export const corporationUsers = [
  {
    id: "corp_ward_14",
    name: "Ward 14 Officer",
    email: "officer14@avadi.city",
    role: "CORPORATION",
    phone: "9222222222",
    wardNumber: 14,
  },
];

export const regularUsers = [
  {
    id: "cmw7qgmyv00015sl8k30p23df",
    name: "Anbuselvan",
    gender: "Male",
    dob: new Date("1996-07-06T00:00:00.000Z"),
    bloodGroup: "A_POS", // Map 'A+' to match your Prisma Enum string if applicable (e.g. A_POS)
    phone: "8939738801",
    avatar: null,
    email: "anbuceo@gmail.com",
    password: "$2b$10$Vdlynccuch7J5JAOBLw5lOrZOrFdytMKIequHc975TawErte8xsi.",
    wardNumber: 39, // Cast your string '39' to a Number if your schema uses Int
    streetName: "2ND STREET, RAMALINGAPURAM",
    notificationEnabled: true, // Converts '1' to boolean true
    isVerified: true, // Converts '1' to boolean true
    createdAt: new Date("2026-11-08T11:12:34.375Z"),
    updatedAt: new Date("2026-11-08T11:12:34.375Z"),
  },
  // You can paste subsequent user objects directly here...
];
