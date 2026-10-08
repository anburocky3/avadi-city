export const initialPosts = [
  {
    id: 1,
    authorName: "Anbu Mani",
    authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
    ward: 4,
    text: "Does anyone know if the local library on HVF Road is open on Sundays? Need a quiet place to study for my competitive exams. Thanks in advance!",
    imageUrl: null,
    timestamp: "2026-07-16T14:30:00Z",
    likes: 12,
    likedByMe: false,
    category: "Announcement",
    comments: [
      {
        id: 101,
        author: "Krithik Balan",
        text: "Yes, it is open on Sundays but only from 9 AM to 1 PM. Better to go early to secure a seat!",
        timestamp: "2026-07-16T14:45:00Z"
      },
      {
        id: 102,
        author: "Anbu Mani",
        text: "Super! Thank you, Krithik. I will go early tomorrow.",
        timestamp: "2026-07-16T15:00:00Z"
      }
    ]
  },
  {
    id: 2,
    authorName: "Priya Sundar",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
    ward: 14,
    text: "Spotted a lost golden retriever near Karayanchavadi main junction. He has a red collar but no tag. He seems friendly but scared. I've fed him some biscuits. Kept him safe in my compound. Contact if he is yours!",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=60",
    timestamp: "2026-07-15T11:00:00Z",
    likes: 38,
    likedByMe: false,
    category: "News",
    comments: [
      {
        id: 201,
        author: "Karthi G",
        text: "I think this belongs to Suresh from KVP Garden! I will inform him immediately.",
        timestamp: "2026-07-15T11:15:00Z"
      },
      {
        id: 202,
        author: "Priya Sundar",
        text: "Great! Please ask him to message me directly. I want to return the pup safely.",
        timestamp: "2026-07-15T11:30:00Z"
      }
    ]
  },
  {
    id: 3,
    authorName: "Dhanush E",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60",
    ward: 20,
    text: "The community park rejuvenation at Kamaraj Nagar East is looking awesome! Special thanks to the civic team and volunteers who helped paint the walls and clean the children's play area. Let's keep our ward clean!",
    imageUrl: "https://images.unsplash.com/photo-1572059002053-8cc5ad2f4a38?w=600&auto=format&fit=crop&q=60",
    timestamp: "2026-07-14T08:20:00Z",
    likes: 54,
    likedByMe: false,
    category: "Announcement",
    comments: [
      {
        id: 301,
        author: "Rajesh Kumar",
        text: "Wow! The paintings look very beautiful. Proud of our volunteers.",
        timestamp: "2026-07-14T09:00:00Z"
      }
    ]
  },
  {
    id: 4,
    authorName: "Saravanan Pillai",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    ward: 25,
    text: "Heavy traffic jam near Thirumullaivoyal railway station due to road patch works. Avoid taking this route for the next 2 hours. Take the bypass instead.",
    imageUrl: null,
    timestamp: "2026-07-16T17:10:00Z",
    likes: 29,
    likedByMe: false,
    category: "News",
    comments: []
  },
  {
    id: 5,
    authorName: "Avadi General Hospital",
    authorAvatar: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=100&auto=format&fit=crop&q=60",
    ward: 12,
    text: "🩸 EMERGENCY BLOOD DONATION NEEDED 🩸\n\nWe urgently require 3 units of O-negative (O-ve) blood for emergency surgery at Avadi General Hospital. If you are an eligible donor or know someone who is, please visit the blood bank or contact us immediately.\n\nContact Info: +91 98401 23456\nPatient ID: AGH-8821",
    imageUrl: null,
    timestamp: "2026-07-16T18:00:00Z",
    likes: 15,
    likedByMe: false,
    isEmergency: true,
    category: "Blood Request",
    comments: [
      {
        id: 501,
        author: "Venkatesh Prasad",
        text: "I am O-ve donor living near Avadi. I can come in 20 minutes. Please confirm if still needed.",
        timestamp: "2026-07-16T18:05:00Z"
      }
    ]
  }
];
