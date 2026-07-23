export const initialFoodSpots = [
  {
    id: 1,
    name: "Aunty's Pure Veg Tiffin Center",
    category: "Veg",
    foodType: "Veg",
    isVeg: true,
    isLateNight: false,
    timing: "6:30 AM – 10:30 PM",
    description: "100% Pure Veg homemade breakfast and dinner. Traditional idli, crispy dosas, and authentic home-style sambar made by Mrs. Lakshmi. Clean and hygienic.",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=60",
    rating: 4.8,
    ward: 20,
    phone: "+919876543210",
    specialty: "Idli, Ghee Podi Dosa & Onion Uttapam",
    menu: [
      { name: "Soft Idli (3 pcs)", price: 40, isVeg: true },
      { name: "Ghee Podi Dosa", price: 60, isVeg: true },
      { name: "Onion Uttapam", price: 50, isVeg: true },
      { name: "Medu Vada (2 pcs)", price: 30, isVeg: true }
    ]
  },
  {
    id: 2,
    name: "Sri Krishna Pure Veg Mess & Meals",
    category: "Veg",
    foodType: "Veg",
    isVeg: true,
    isLateNight: false,
    timing: "7:00 AM – 10:00 PM",
    description: "Authentic South Indian Pure Veg Unlimited Meals, Vatha Kuzhambu, Poriyal, Appalam & Pure Cow Ghee. Traditional banana leaf meal experience.",
    imageUrl: "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=60",
    rating: 4.9,
    ward: 12,
    phone: "+919876543214",
    specialty: "Full South Indian Meals & Special Sambar",
    menu: [
      { name: "Special South Indian Unlimited Veg Meal", price: 110, isVeg: true },
      { name: "Mini Veg Tiffin Combo", price: 90, isVeg: true },
      { name: "Curd Rice with Mango Pickle", price: 50, isVeg: true }
    ]
  },
  {
    id: 3,
    name: "Senthil Chettinad Late Night Non-Veg Kitchen",
    category: "Non-Veg",
    foodType: "Non-Veg",
    isVeg: false,
    isLateNight: true,
    timing: "6:00 PM – 2:30 AM (Late Night)",
    description: "Spicy Chettinad biryani, mutton chukka, bun parotta, and seafood gravies served fresh till 2:30 AM midnight. Hot & piping.",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=60",
    rating: 4.6,
    ward: 1,
    phone: "+919876543212",
    specialty: "Late Night Chicken Biryani, Salna & Bun Parotta",
    menu: [
      { name: "Midnight Chettinad Chicken Biryani", price: 160, isVeg: false },
      { name: "Mutton Chukka Gravy", price: 210, isVeg: false },
      { name: "Bun Parotta (2 pcs) with Salna", price: 70, isVeg: false },
      { name: "Pepper Chicken Fry", price: 140, isVeg: false }
    ]
  },
  {
    id: 4,
    name: "Avadi Royal Midnight Biryani & Grill",
    category: "Non-Veg",
    foodType: "Non-Veg",
    isVeg: false,
    isLateNight: true,
    timing: "7:00 PM – 4:00 AM (Midnight Special)",
    description: "Avadi's famous midnight Dum Biryani, Charcoal Tandoori Chicken, and BBQ Wings served hot till 4:00 AM in the morning.",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=60",
    rating: 4.8,
    ward: 8,
    phone: "+919876543215",
    specialty: "4:00 AM Midnight Mutton Biryani & Full Grill",
    menu: [
      { name: "Midnight Mutton Seeraga Samba Biryani", price: 240, isVeg: false },
      { name: "Full Charcoal Grill Chicken", price: 380, isVeg: false },
      { name: "Tandoori Chicken (Half)", price: 200, isVeg: false }
    ]
  },
  {
    id: 5,
    name: "Creamy Cones Late Night Ice Cream",
    category: "Ice Cream",
    foodType: "Ice Cream",
    isVeg: true,
    isLateNight: true,
    timing: "4:00 PM – 2:00 AM (Late Night)",
    description: "Late-night sweet cravings! 100% natural, rich artisanal Ice Creams, Matka Kulfi, Falooda, and Belgian Chocolate scoops open till 2:00 AM.",
    imageUrl: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=600&auto=format&fit=crop&q=60",
    rating: 4.9,
    ward: 15,
    phone: "+919876543216",
    specialty: "Midnight Malai Matka Kulfi & Belgian Chocolate",
    menu: [
      { name: "Royal Malai Matka Kulfi", price: 70, isVeg: true },
      { name: "Belgian Dark Chocolate Cone", price: 90, isVeg: true },
      { name: "Special Royal Rose Falooda", price: 120, isVeg: true },
      { name: "Fresh Tender Coconut Ice Cream (2 scoops)", price: 100, isVeg: true }
    ]
  },
  {
    id: 6,
    name: "Frosty Scoop Midnight Sundae Parlour",
    category: "Ice Cream",
    foodType: "Ice Cream",
    isVeg: true,
    isLateNight: true,
    timing: "5:00 PM – 3:30 AM (Midnight Sundaes)",
    description: "Late night Sundae bowls, Sizzling Brownie with Vanilla Ice Cream, Thick Oreo Shakes, and Waffles available till 3:30 AM.",
    imageUrl: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600&auto=format&fit=crop&q=60",
    rating: 4.8,
    ward: 4,
    phone: "+919876543217",
    specialty: "Sizzling Brownie & Midnight Chocolate Sundae",
    menu: [
      { name: "Sizzling Brownie with Vanilla Scoop", price: 150, isVeg: true },
      { name: "Death by Chocolate Mega Sundae", price: 180, isVeg: true },
      { name: "Thick Nutella Oreo Milkshake", price: 130, isVeg: true }
    ]
  },
  {
    id: 7,
    name: "Avadi 24/7 Midnight Tiffin & Tea Stall",
    category: "Veg",
    foodType: "Veg",
    isVeg: true,
    isLateNight: true,
    timing: "Open 24 Hours (24/7 Midnight Hub)",
    description: "24-hour round-the-clock hot Ginger Tea, filter coffee, steaming soft Idli, Vada, and hot Podi Dosa available 24/7 for night shift workers & travellers.",
    imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=60",
    rating: 4.9,
    ward: 2,
    phone: "+919876543218",
    specialty: "24/7 Hot Filter Coffee, Night Idli & Podi Dosa",
    menu: [
      { name: "Hot Special Filter Coffee (24/7)", price: 20, isVeg: true },
      { name: "Midnight Hot Idli (2 pcs) with Sambar", price: 30, isVeg: true },
      { name: "Night Ghee Podi Dosa", price: 55, isVeg: true }
    ]
  },
  {
    id: 8,
    name: "Pranav's Organic Millet Sweets",
    category: "Veg",
    foodType: "Veg",
    isVeg: true,
    isLateNight: false,
    timing: "8:00 AM – 9:30 PM",
    description: "Healthy sweets and snacks made from millets, ragi, and organic jaggery. No white sugar, no artificial color, no preservatives.",
    imageUrl: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=60",
    rating: 4.7,
    ward: 25,
    phone: "+919876543213",
    specialty: "Millet Laddu & Ragi Halwa",
    menu: [
      { name: "Assorted Millet Laddu (500g)", price: 220, isVeg: true },
      { name: "Organic Ragi Halwa (250g)", price: 110, isVeg: true }
    ]
  }
];
