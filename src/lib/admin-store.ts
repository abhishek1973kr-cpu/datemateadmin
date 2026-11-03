"use client";

import {
  User,
  PartnerApplication,
  Companion,
  Booking,
  PaymentTransaction,
  ServiceState,
  PricingConfig,
  INITIAL_SERVICE_STATES,
  INITIAL_PRICING_CONFIG,
  AdminLog,
  AdminNotification
} from "./types";
import {
  isFirebaseConfigured,
  subscribeToCompanions,
  subscribeToPartners,
  subscribeToUsers,
  subscribeToBookings,
  subscribeToPayments,
  subscribeToLocations,
  subscribeToPricing,
  subscribeToNotifications,
  firestoreSaveCompanion,
  firestoreDeleteCompanion,
  firestoreUpdatePartner,
  firestoreUpdateUser,
  firestoreUpdateBooking,
  firestoreSaveLocation,
  firestoreSavePricing,
  firestoreLogAdminAction,
  firestoreSavePayment
} from "./firebase";

// Local Storage Keys
const ADMIN_COMPANIONS_KEY = "datemate_admin_companions_v1";
const ADMIN_PARTNERS_KEY = "datemate_admin_partners_v1";
const ADMIN_USERS_KEY = "datemate_admin_users_v1";
const ADMIN_BOOKINGS_KEY = "datemate_admin_bookings_v1";
const ADMIN_PAYMENTS_KEY = "datemate_admin_payments_v1";
const ADMIN_LOCATIONS_KEY = "datemate_admin_locations_v1";
const ADMIN_PRICING_KEY = "datemate_admin_pricing_v1";
const ADMIN_LOGS_KEY = "datemate_admin_logs_v1";
const ADMIN_NOTIFS_KEY = "datemate_admin_notifs_v1";

// Seed data
export const SEED_USERS: User[] = [
  {
    id: "user-client-1",
    name: "Karan Singhal",
    username: "karan",
    email: "karan.singhal@example.com",
    phone: "+91 98111 22334",
    role: "user",
    age: 26,
    dob: "1998-04-12",
    fullAddress: "Flat 502, Green Glen Layout, Bellandur",
    city: "Delhi",
    state: "Delhi",
    isAgeVerified: true,
    authProvider: "google",
    googleVerified: true,
    hasPaidRegistrationFee: true,
    registrationTransactionId: "pay_rzp_usr_99_demo",
    registrationFeeAmount: 99,
    registrationFeePaidAt: "2026-02-01T10:05:00Z",
    status: "active",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-02-01T10:00:00Z"
  },
  {
    id: "user-client-2",
    name: "Vikramaditya Roy",
    username: "vikram_roy",
    email: "vikram.roy@example.com",
    phone: "+91 98300 11223",
    role: "user",
    age: 31,
    city: "Kolkata",
    state: "West Bengal",
    isAgeVerified: true,
    authProvider: "credentials",
    hasPaidRegistrationFee: true,
    registrationTransactionId: "pay_rzp_usr_99_kol1",
    registrationFeeAmount: 99,
    registrationFeePaidAt: "2026-02-10T14:20:00Z",
    status: "active",
    avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
    createdAt: "2026-02-10T14:00:00Z"
  },
  {
    id: "user-client-3",
    name: "Rohan Varma",
    username: "rohanv",
    email: "rohan.varma@example.com",
    phone: "+91 98450 99887",
    role: "user",
    age: 29,
    city: "Bangalore",
    state: "Karnataka",
    isAgeVerified: true,
    authProvider: "google",
    hasPaidRegistrationFee: false,
    status: "active",
    createdAt: "2026-02-14T11:15:00Z"
  }
];

export const SEED_PARTNERS: PartnerApplication[] = [
  {
    id: "DM-PTR-10024",
    userId: "user-comp-1",
    fullLegalName: "Aanya Sharma",
    dob: "2000-05-14",
    gender: "female",
    mobile: "+91 98222 33445",
    email: "aanya.sharma@example.com",
    residentialAddress: "Flat 402, Pali Hill, Bandra West",
    city: "Maharashtra",
    state: "Maharashtra",
    pincode: "400050",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
    ],
    aadhaarNumber: "7849-3829-1920",
    maskedAadhaar: "XXXX-XXXX-1920",
    aadhaarDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    aadhaarConsent: true,
    feeAmount: 199,
    feePaid: true,
    feeTransactionId: "pay_rzp_ptr_10024",
    feePaidAt: "2026-01-15T10:05:00Z",
    status: "approved",
    submittedAt: "2026-01-15T10:00:00Z",
    approvedAt: "2026-01-15T12:00:00Z",
    headline: "Art curator, foodie & enthusiastic conversationalist",
    bio: "Passionate about world cinema, literature, and art exhibitions in Mumbai.",
    hourlyPrice: 1500,
    price30Min: 900,
    services: ["Fine Dining & Cafes", "Cinema & Theater", "Social & Family Events"],
    languages: ["English", "Hindi", "Marathi"],
    interests: ["Contemporary Art", "Cinema", "Italian Cuisine"],
    isAvailable: true,
    isActive: true,
    companionId: "comp-1"
  },
  {
    id: "DM-PTR-10492",
    fullLegalName: "Neha Chaurasia",
    dob: "2001-08-22",
    gender: "female",
    mobile: "+91 98350 49122",
    email: "neha.patna@example.com",
    residentialAddress: "House 12, Boring Canal Road, Near Maurya Lok",
    city: "Patna",
    state: "Bihar",
    pincode: "800001",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
    ],
    aadhaarNumber: "9123-4567-8901",
    maskedAadhaar: "XXXX-XXXX-8901",
    aadhaarDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    aadhaarConsent: true,
    feeAmount: 199,
    feePaid: true,
    feeTransactionId: "pay_rzp_ptr_10492",
    feePaidAt: "2026-11-02T18:30:00Z",
    status: "pending",
    submittedAt: "2026-11-02T18:25:00Z",
    headline: "Literature graduate & warm cafe conversationalist",
    bio: "Well-spoken and courteous companion available for cafe dates and literary discussions.",
    hourlyPrice: 1200,
    price30Min: 700,
    services: ["Fine Dining & Cafes", "Coffee & Deep Conversation"],
    languages: ["Hindi", "English", "Bhojpuri"],
    interests: ["Literature", "Coffee Tasting", "Poetry"],
    isAvailable: true,
    isActive: true
  },
  {
    id: "DM-PTR-10815",
    fullLegalName: "Priyanka Sen",
    dob: "1999-11-05",
    gender: "female",
    mobile: "+91 98310 77441",
    email: "priyanka.sen@example.com",
    residentialAddress: "Park Mansions, Park Street",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700016",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80"
    ],
    aadhaarNumber: "4521-8932-9012",
    maskedAadhaar: "XXXX-XXXX-9012",
    aadhaarDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    aadhaarConsent: true,
    feeAmount: 199,
    feePaid: true,
    feeTransactionId: "pay_rzp_ptr_10815",
    feePaidAt: "2026-11-03T09:15:00Z",
    status: "pending",
    submittedAt: "2026-11-03T09:00:00Z",
    headline: "Classical musician & heritage walker in City of Joy",
    bio: "Passionate about Rabindra Sangeet, colonial architecture and museum tours.",
    hourlyPrice: 1300,
    price30Min: 750,
    services: ["City Tour & Exploration", "Cinema & Theater", "Fine Dining & Cafes"],
    languages: ["Bengali", "English", "Hindi"],
    interests: ["Heritage Walk", "Acoustic Music", "Art Museums"],
    isAvailable: true,
    isActive: true
  }
];

export const SEED_COMPANIONS: Companion[] = [
  {
    id: "comp-1",
    partnerId: "DM-PTR-10024",
    fullName: "Aanya Sharma",
    gender: "female",
    age: 24,
    city: "Maharashtra",
    state: "Maharashtra",
    headline: "Art curator, foodie & enthusiastic conversationalist",
    bio: "Hey there! I am a 24-year-old creative professional living in Mumbai, Maharashtra. Passionate about world cinema, literature, art exhibitions, and boutique dining. Strictly platonic & respectful.",
    price30Min: 900,
    hourlyPrice: 1500,
    rating: 4.9,
    reviewCount: 38,
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["English", "Hindi", "Marathi"],
    interests: ["Contemporary Art", "Cinema", "Italian Cuisine", "Travel"],
    services: ["Fine Dining & Cafes", "Cinema & Theater", "Social & Family Events"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-01-15T10:00:00Z"
  },
  {
    id: "comp-2",
    fullName: "Kabir Malhotra",
    gender: "male",
    age: 26,
    city: "Bangalore",
    state: "Karnataka",
    headline: "Tech founder, fitness enthusiast & travel companion",
    bio: "Hi! I am Kabir, based in Koramangala, Bangalore. A warm, well-spoken listener and adventurous companion. I love exploring new cafes, running marathons, attend tech conferences or comedy gigs.",
    price30Min: 1100,
    hourlyPrice: 1800,
    rating: 4.95,
    reviewCount: 29,
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["English", "Hindi", "Kannada"],
    interests: ["Startups", "Running", "Electronic Music"],
    services: ["Fine Dining & Cafes", "City Tour & Exploration"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-01-20T10:00:00Z"
  },
  {
    id: "comp-3",
    fullName: "Rhea Sen",
    gender: "female",
    age: 23,
    city: "Delhi",
    state: "Delhi",
    headline: "Fashion stylist & vibrant conversationalist",
    bio: "Delhi girl with a passion for high street aesthetics, gourmet coffee, and contemporary theater. Available for shopping dates, social galas, and intellectual banter.",
    price30Min: 950,
    hourlyPrice: 1600,
    rating: 4.88,
    reviewCount: 44,
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["Hindi", "English", "Punjabi"],
    interests: ["Fashion", "Theater", "Fine Dining"],
    services: ["Shopping & Styling", "Cinema & Theater", "Fine Dining & Cafes"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-01-22T10:00:00Z"
  },
  {
    id: "comp-4",
    fullName: "Sourav Ganguly",
    gender: "male",
    age: 27,
    city: "Kolkata",
    state: "West Bengal",
    headline: "Heritage storyteller & gourmet culinary companion",
    bio: "Born and raised in North Kolkata. Enthusiastic about colonial architecture, old world cafes, and classical music concerts. Courteous and engaging companion.",
    price30Min: 800,
    hourlyPrice: 1400,
    rating: 4.92,
    reviewCount: 26,
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["Bengali", "English", "Hindi"],
    interests: ["History", "Coffee", "Cricket"],
    services: ["City Tour & Exploration", "Fine Dining & Cafes"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-01-25T10:00:00Z"
  },
  {
    id: "comp-5",
    fullName: "Ananya Reddy",
    gender: "female",
    age: 25,
    city: "Hyderabad",
    state: "Telangana",
    headline: "Architect, bibliophile & acoustic music lover",
    bio: "Passionate about modern architecture, cozy heritage book cafes in Jubilee Hills, and weekend art walks. Calm, empathetic, and respectful presence.",
    price30Min: 900,
    hourlyPrice: 1500,
    rating: 4.9,
    reviewCount: 31,
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["Telugu", "English", "Hindi"],
    interests: ["Architecture", "Books", "Baking"],
    services: ["Coffee & Deep Conversation", "Social & Family Events"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-01-28T10:00:00Z"
  },
  {
    id: "comp-6",
    fullName: "Alok Jha",
    gender: "male",
    age: 26,
    city: "Patna",
    state: "Bihar",
    headline: "Civil services aspirant & articulate conversationalist",
    bio: "Based in Patna. Passionate about history, political science, and exploring riverfront promenades along Marine Drive Ganga. Polite, intellectual, and friendly.",
    price30Min: 700,
    hourlyPrice: 1200,
    rating: 4.85,
    reviewCount: 19,
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["Hindi", "English", "Maithili"],
    interests: ["Current Affairs", "Chess", "Gourmet Street Food"],
    services: ["Coffee & Deep Conversation", "City Tour & Exploration"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-02-01T10:00:00Z"
  },
  {
    id: "comp-7",
    fullName: "Simran Kaur",
    gender: "female",
    age: 24,
    city: "Jharkhand (Ranchi)",
    state: "Jharkhand",
    headline: "Nature lover, botanist & waterfall explorer",
    bio: "Ranchi native loving scenic drives to Hundru and Jonha falls, calm cafe conversations, and indie music. Welcoming, friendly, and respectful companion.",
    price30Min: 750,
    hourlyPrice: 1300,
    rating: 4.91,
    reviewCount: 22,
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    languages: ["Hindi", "English"],
    interests: ["Nature Trails", "Photography", "Acoustic Pop"],
    services: ["City Tour & Exploration", "Coffee & Deep Conversation"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    createdAt: "2026-02-05T10:00:00Z"
  }
];

export const SEED_BOOKINGS: Booking[] = [
  {
    id: "bk-1001",
    clientId: "user-client-1",
    clientName: "Karan Singhal",
    clientPhone: "+91 98111 22334",
    companionId: "comp-1",
    companionName: "Aanya Sharma",
    companionPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    companionCity: "Mumbai",
    date: "2026-11-10",
    time: "19:00",
    durationHours: 3,
    activity: "Fine Dining & Cafes",
    meetingLocation: "Bastian, Bandra West, Mumbai",
    hourlyPrice: 1500,
    subtotal: 4500,
    platformFee: 450,
    tax: 225,
    totalAmount: 5175,
    status: "confirmed",
    paymentStatus: "paid",
    paymentId: "pay_rzp_demo_101",
    specialNotes: "Looking forward to great continental food and music conversation.",
    createdAt: "2026-11-01T14:30:00Z"
  },
  {
    id: "bk-1002",
    clientId: "user-client-1",
    clientName: "Karan Singhal",
    clientPhone: "+91 98111 22334",
    companionId: "comp-3",
    companionName: "Rhea Sen",
    companionPhoto: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80",
    companionCity: "Delhi NCR",
    date: "2026-11-15",
    time: "15:00",
    durationHours: 2,
    activity: "Shopping & Styling",
    meetingLocation: "Select CITYWALK Mall, Saket, New Delhi",
    hourlyPrice: 1600,
    subtotal: 3200,
    platformFee: 320,
    tax: 160,
    totalAmount: 3680,
    status: "pending",
    paymentStatus: "pending",
    specialNotes: "Need wardrobe advice for winter wear.",
    createdAt: "2026-11-02T16:00:00Z"
  },
  {
    id: "bk-1003",
    clientId: "user-client-2",
    clientName: "Vikramaditya Roy",
    clientPhone: "+91 98300 11223",
    companionId: "comp-4",
    companionName: "Sourav Ganguly",
    companionPhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    companionCity: "Kolkata",
    date: "2026-11-04",
    time: "18:00",
    durationHours: 2,
    activity: "Fine Dining & Cafes",
    meetingLocation: "Flurys, Park Street, Kolkata",
    hourlyPrice: 1400,
    subtotal: 2800,
    platformFee: 280,
    tax: 140,
    totalAmount: 3220,
    status: "completed",
    paymentStatus: "paid",
    paymentId: "pay_rzp_demo_103",
    createdAt: "2026-10-30T10:00:00Z"
  }
];

export const SEED_PAYMENTS: PaymentTransaction[] = [
  {
    id: "pay_rzp_usr_99_demo",
    type: "user_registration",
    referenceId: "user-client-1",
    customerName: "Karan Singhal",
    customerEmail: "karan.singhal@example.com",
    customerPhone: "+91 98111 22334",
    amount: 99,
    currency: "INR",
    purpose: "DateMate User Registration Fee (₹99 Escrow & ID Protection)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_usr_99_demo",
    status: "paid",
    date: "2026-02-01T10:05:00Z"
  },
  {
    id: "pay_rzp_usr_99_kol1",
    type: "user_registration",
    referenceId: "user-client-2",
    customerName: "Vikramaditya Roy",
    customerEmail: "vikram.roy@example.com",
    customerPhone: "+91 98300 11223",
    amount: 99,
    currency: "INR",
    purpose: "DateMate User Registration Fee (₹99 Escrow & ID Protection)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_usr_99_kol1",
    status: "paid",
    date: "2026-02-10T14:20:00Z"
  },
  {
    id: "pay_rzp_ptr_10024",
    type: "partner_registration",
    referenceId: "DM-PTR-10024",
    customerName: "Aanya Sharma",
    customerEmail: "aanya.sharma@example.com",
    customerPhone: "+91 98222 33445",
    amount: 199,
    currency: "INR",
    purpose: "DateMate Partner Verification Fee (₹199 KYC & Security Check)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_ptr_10024",
    status: "paid",
    date: "2026-01-15T10:05:00Z"
  },
  {
    id: "pay_rzp_ptr_10492",
    type: "partner_registration",
    referenceId: "DM-PTR-10492",
    customerName: "Neha Chaurasia",
    customerEmail: "neha.patna@example.com",
    customerPhone: "+91 98350 49122",
    amount: 199,
    currency: "INR",
    purpose: "DateMate Partner Verification Fee (₹199 KYC & Security Check)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_ptr_10492",
    status: "paid",
    date: "2026-11-02T18:30:00Z"
  },
  {
    id: "pay_rzp_ptr_10815",
    type: "partner_registration",
    referenceId: "DM-PTR-10815",
    customerName: "Priyanka Sen",
    customerEmail: "priyanka.sen@example.com",
    customerPhone: "+91 98310 77441",
    amount: 199,
    currency: "INR",
    purpose: "DateMate Partner Verification Fee (₹199 KYC & Security Check)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_ptr_10815",
    status: "paid",
    date: "2026-11-03T09:15:00Z"
  },
  {
    id: "pay_rzp_demo_101",
    type: "booking",
    referenceId: "bk-1001",
    customerName: "Karan Singhal",
    customerEmail: "karan.singhal@example.com",
    amount: 5175,
    currency: "INR",
    purpose: "Companionship Booking with Aanya Sharma (3 hrs)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_demo_101",
    status: "paid",
    date: "2026-11-01T14:35:00Z"
  },
  {
    id: "pay_rzp_demo_103",
    type: "booking",
    referenceId: "bk-1003",
    customerName: "Vikramaditya Roy",
    customerEmail: "vikram.roy@example.com",
    amount: 3220,
    currency: "INR",
    purpose: "Companionship Booking with Sourav Ganguly (2 hrs)",
    gateway: "Razorpay",
    gatewayTransactionId: "pay_rzp_demo_103",
    status: "paid",
    date: "2026-10-30T10:05:00Z"
  }
];

export const SEED_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "New Partner Application",
    message: "Priyanka Sen submitted a partner application in Kolkata with ₹199 verification fee paid.",
    type: "partner",
    isRead: false,
    link: "/dashboard/partners",
    createdAt: "2026-11-03T09:15:00Z"
  },
  {
    id: "notif-2",
    title: "New Booking Confirmed",
    message: "Booking #bk-1001 confirmed for Aanya Sharma in Mumbai (₹5,175 paid).",
    type: "booking",
    isRead: false,
    link: "/dashboard/bookings",
    createdAt: "2026-11-01T14:35:00Z"
  },
  {
    id: "notif-3",
    title: "User Fee Received",
    message: "Karan Singhal verified account with ₹99 registration fee.",
    type: "payment",
    isRead: true,
    link: "/dashboard/payments",
    createdAt: "2026-02-01T10:05:00Z"
  }
];

export const SEED_LOGS: AdminLog[] = [
  {
    id: "log-1",
    adminEmail: "admin@datemate.in",
    action: "PARTNER_APPROVED",
    targetId: "DM-PTR-10024",
    targetType: "partner",
    details: "Approved Aanya Sharma application and published companion comp-1",
    timestamp: "2026-01-15T12:00:00Z"
  },
  {
    id: "log-2",
    adminEmail: "admin@datemate.in",
    action: "PRICING_UPDATED",
    targetId: "datemate_pricing_config",
    targetType: "pricing",
    details: "Configured 30min (₹600), 1h (₹1200), 2h (₹2000), 3h (₹2700)",
    timestamp: "2026-01-01T10:00:00Z"
  }
];

// Helper methods with localStorage fallback
export function getStoredAdminCompanions(): Companion[] {
  if (typeof window === "undefined") return SEED_COMPANIONS;
  try {
    const raw = localStorage.getItem(ADMIN_COMPANIONS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_COMPANIONS_KEY, JSON.stringify(SEED_COMPANIONS));
      return SEED_COMPANIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_COMPANIONS;
  }
}

export function saveAdminCompanions(companions: Companion[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_COMPANIONS_KEY, JSON.stringify(companions));
  }
}

export function getStoredAdminPartners(): PartnerApplication[] {
  if (typeof window === "undefined") return SEED_PARTNERS;
  try {
    const raw = localStorage.getItem(ADMIN_PARTNERS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_PARTNERS_KEY, JSON.stringify(SEED_PARTNERS));
      return SEED_PARTNERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PARTNERS;
  }
}

export function saveAdminPartners(partners: PartnerApplication[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_PARTNERS_KEY, JSON.stringify(partners));
  }
}

export function getStoredAdminUsers(): User[] {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_USERS;
  }
}

export function saveAdminUsers(users: User[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
  }
}

export function getStoredAdminBookings(): Booking[] {
  if (typeof window === "undefined") return SEED_BOOKINGS;
  try {
    const raw = localStorage.getItem(ADMIN_BOOKINGS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_BOOKINGS_KEY, JSON.stringify(SEED_BOOKINGS));
      return SEED_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_BOOKINGS;
  }
}

export function saveAdminBookings(bookings: Booking[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_BOOKINGS_KEY, JSON.stringify(bookings));
  }
}

export function getStoredAdminPayments(): PaymentTransaction[] {
  if (typeof window === "undefined") return SEED_PAYMENTS;
  try {
    const raw = localStorage.getItem(ADMIN_PAYMENTS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_PAYMENTS_KEY, JSON.stringify(SEED_PAYMENTS));
      return SEED_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PAYMENTS;
  }
}

export function saveAdminPayments(payments: PaymentTransaction[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_PAYMENTS_KEY, JSON.stringify(payments));
  }
}

export function getStoredAdminLocations(): ServiceState[] {
  if (typeof window === "undefined") return INITIAL_SERVICE_STATES;
  try {
    const raw = localStorage.getItem(ADMIN_LOCATIONS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_LOCATIONS_KEY, JSON.stringify(INITIAL_SERVICE_STATES));
      return INITIAL_SERVICE_STATES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SERVICE_STATES;
  }
}

export function saveAdminLocations(locations: ServiceState[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_LOCATIONS_KEY, JSON.stringify(locations));
  }
}

export function getStoredAdminPricing(): PricingConfig {
  if (typeof window === "undefined") return INITIAL_PRICING_CONFIG;
  try {
    const raw = localStorage.getItem(ADMIN_PRICING_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_PRICING_KEY, JSON.stringify(INITIAL_PRICING_CONFIG));
      return INITIAL_PRICING_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRICING_CONFIG;
  }
}

export function saveAdminPricing(pricing: PricingConfig) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_PRICING_KEY, JSON.stringify(pricing));
  }
}

export function getStoredAdminLogs(): AdminLog[] {
  if (typeof window === "undefined") return SEED_LOGS;
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_LOGS;
  }
}

export function saveAdminLogs(logs: AdminLog[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs));
  }
}

export function getStoredAdminNotifications(): AdminNotification[] {
  if (typeof window === "undefined") return SEED_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(ADMIN_NOTIFS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_NOTIFS_KEY, JSON.stringify(SEED_NOTIFICATIONS));
      return SEED_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_NOTIFICATIONS;
  }
}

export function saveAdminNotifications(notifs: AdminNotification[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_NOTIFS_KEY, JSON.stringify(notifs));
  }
}

// ============================================================================
// CORE BUSINESS OPERATIONS WITH INSTANT SYNCHRONIZATION
// ============================================================================

/**
 * Add or Edit Companion profile
 */
export async function syncSaveCompanion(companion: Companion): Promise<void> {
  // 1. Update local storage cache
  const list = getStoredAdminCompanions();
  const idx = list.findIndex(c => c.id === companion.id);
  if (idx !== -1) {
    list[idx] = { ...companion, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...companion, createdAt: companion.createdAt || new Date().toISOString() });
  }
  saveAdminCompanions(list);

  // 2. Log admin action
  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: idx !== -1 ? "COMPANION_UPDATED" : "COMPANION_CREATED",
    targetId: companion.id,
    targetType: "companion",
    details: `${idx !== -1 ? "Updated" : "Created"} companion ${companion.fullName} (${companion.city}) with ${companion.photos.length} photos`
  });

  // 3. Write to Firestore for automatic User Panel synchronization
  if (isFirebaseConfigured) {
    await firestoreSaveCompanion(companion);
  }
}

/**
 * Delete Companion profile
 */
export async function syncDeleteCompanion(companionId: string): Promise<void> {
  const list = getStoredAdminCompanions().filter(c => c.id !== companionId);
  saveAdminCompanions(list);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "COMPANION_DELETED",
    targetId: companionId,
    targetType: "companion",
    details: `Deleted companion ${companionId} from directory`
  });

  if (isFirebaseConfigured) {
    await firestoreDeleteCompanion(companionId);
  }
}

/**
 * Toggle Companion Active status (Deactivating removes from discovery without breaking past bookings)
 */
export async function syncToggleCompanionStatus(companionId: string, isActive: boolean): Promise<void> {
  const list = getStoredAdminCompanions();
  const idx = list.findIndex(c => c.id === companionId);
  if (idx !== -1) {
    list[idx].isActive = isActive;
    list[idx].updatedAt = new Date().toISOString();
    saveAdminCompanions(list);

    addAuditLog({
      adminEmail: "admin@datemate.in",
      action: isActive ? "COMPANION_ACTIVATED" : "COMPANION_DEACTIVATED",
      targetId: companionId,
      targetType: "companion",
      details: `${isActive ? "Activated" : "Deactivated"} companion ${list[idx].fullName}`
    });

    if (isFirebaseConfigured) {
      await firestoreSaveCompanion(list[idx]);
    }
  }
}

/**
 * Approve Partner Application -> creates/updates public Companion profile
 */
export async function syncApprovePartner(appId: string): Promise<Companion | null> {
  const partners = getStoredAdminPartners();
  const partner = partners.find(p => p.id === appId);
  if (!partner) return null;

  partner.status = "approved";
  partner.approvedAt = new Date().toISOString();

  // Determine or reuse companion ID
  const companionId = partner.companionId || `comp-${Date.now().toString().slice(-6)}`;
  partner.companionId = companionId;

  // Calculate age from dob
  let computedAge = 24;
  if (partner.dob) {
    const birthYear = new Date(partner.dob).getFullYear();
    if (!isNaN(birthYear)) {
      computedAge = Math.max(18, new Date().getFullYear() - birthYear);
    }
  }

  const companions = getStoredAdminCompanions();
  const existingCompIdx = companions.findIndex(c => c.id === companionId || c.partnerId === partner.id);

  const companionProfile: Companion = {
    id: companionId,
    userId: partner.userId,
    partnerId: partner.id,
    fullName: partner.fullLegalName,
    gender: partner.gender,
    age: computedAge,
    city: partner.city,
    state: partner.state,
    headline: partner.headline || `Charming & Verified Companion in ${partner.city}`,
    bio: partner.bio || `Verified DateMate partner in ${partner.city}, ${partner.state}. Engaging, respectful, and courteous companion.`,
    hourlyPrice: partner.hourlyPrice || 1500,
    price30Min: partner.price30Min || 900,
    rating: 5.0,
    reviewCount: 0,
    photos: partner.photos && partner.photos.length > 0 ? partner.photos : [],
    photoPublicIds: partner.photoPublicIds || [],
    languages: partner.languages && partner.languages.length > 0 ? partner.languages : ["English", "Hindi"],
    interests: partner.interests && partner.interests.length > 0 ? partner.interests : ["Fine Dining", "Cinema"],
    services: partner.services && partner.services.length > 0 ? partner.services : ["Fine Dining & Cafes", "Cinema & Theater"],
    verificationStatus: "approved",
    isAvailable: true,
    isActive: true,
    idProofType: "Aadhaar Card",
    idProofNumber: partner.maskedAadhaar,
    createdAt: partner.submittedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (existingCompIdx !== -1) {
    companions[existingCompIdx] = companionProfile;
  } else {
    companions.unshift(companionProfile);
  }

  saveAdminPartners(partners);
  saveAdminCompanions(companions);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "PARTNER_APPROVED",
    targetId: appId,
    targetType: "partner",
    details: `Approved application for ${partner.fullLegalName} (Partner ID: ${appId}) and published companion profile ${companionId}`
  });

  if (isFirebaseConfigured) {
    await firestoreUpdatePartner(appId, {
      status: "approved",
      approvedAt: partner.approvedAt,
      companionId
    });
    await firestoreSaveCompanion(companionProfile);
  }

  return companionProfile;
}

/**
 * Reject Partner Application with Reason
 */
export async function syncRejectPartner(appId: string, reason: string): Promise<boolean> {
  const partners = getStoredAdminPartners();
  const partner = partners.find(p => p.id === appId);
  if (!partner) return false;

  partner.status = "rejected";
  partner.rejectionReason = reason;

  // Deactivate linked companion profile if any
  if (partner.companionId) {
    const companions = getStoredAdminCompanions().filter(c => c.id !== partner.companionId && c.partnerId !== appId);
    saveAdminCompanions(companions);
    if (isFirebaseConfigured && partner.companionId) {
      await firestoreDeleteCompanion(partner.companionId);
    }
  }

  saveAdminPartners(partners);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "PARTNER_REJECTED",
    targetId: appId,
    targetType: "partner",
    details: `Rejected application ${appId}. Reason: ${reason}`
  });

  if (isFirebaseConfigured) {
    await firestoreUpdatePartner(appId, {
      status: "rejected",
      rejectionReason: reason
    });
  }

  return true;
}

/**
 * Suspend Partner Application
 */
export async function syncSuspendPartner(appId: string): Promise<boolean> {
  const partners = getStoredAdminPartners();
  const partner = partners.find(p => p.id === appId);
  if (!partner) return false;

  partner.status = "suspended";

  if (partner.companionId) {
    const companions = getStoredAdminCompanions();
    const comp = companions.find(c => c.id === partner.companionId || c.partnerId === appId);
    if (comp) {
      comp.isActive = false;
      comp.verificationStatus = "rejected";
      saveAdminCompanions(companions);
      if (isFirebaseConfigured) {
        await firestoreSaveCompanion(comp);
      }
    }
  }

  saveAdminPartners(partners);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "PARTNER_SUSPENDED",
    targetId: appId,
    targetType: "partner",
    details: `Suspended partner ${partner.fullLegalName} (${appId})`
  });

  if (isFirebaseConfigured) {
    await firestoreUpdatePartner(appId, { status: "suspended" });
  }

  return true;
}

/**
 * Suspend or Activate User Account
 */
export async function syncToggleUserStatus(userId: string, isSuspended: boolean, reason?: string): Promise<void> {
  const users = getStoredAdminUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = isSuspended ? "suspended" : "active";
    if (reason) user.suspensionReason = reason;
    saveAdminUsers(users);

    addAuditLog({
      adminEmail: "admin@datemate.in",
      action: isSuspended ? "USER_SUSPENDED" : "USER_ACTIVATED",
      targetId: userId,
      targetType: "user",
      details: `${isSuspended ? "Suspended" : "Activated"} user ${user.name} (${user.email}). ${reason ? `Reason: ${reason}` : ""}`
    });

    if (isFirebaseConfigured) {
      await firestoreUpdateUser(userId, {
        status: user.status,
        suspensionReason: reason || ""
      });
    }
  }
}

/**
 * Toggle Service Location Availability
 */
export async function syncToggleLocation(locId: string, isAvailable: boolean): Promise<void> {
  const locs = getStoredAdminLocations();
  const loc = locs.find(l => l.id === locId);
  if (loc) {
    loc.isAvailable = isAvailable;
    loc.updatedAt = new Date().toISOString();
    saveAdminLocations(locs);

    addAuditLog({
      adminEmail: "admin@datemate.in",
      action: "LOCATION_TOGGLED",
      targetId: locId,
      targetType: "location",
      details: `Location ${loc.name} set to ${isAvailable ? "AVAILABLE" : "UNAVAILABLE"}`
    });

    if (isFirebaseConfigured) {
      await firestoreSaveLocation(loc);
    }
  }
}

/**
 * Add New Location
 */
export async function syncAddLocation(newLoc: ServiceState): Promise<void> {
  const locs = getStoredAdminLocations();
  const existing = locs.findIndex(l => l.id === newLoc.id);
  if (existing !== -1) {
    locs[existing] = newLoc;
  } else {
    locs.push(newLoc);
  }
  saveAdminLocations(locs);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "LOCATION_ADDED",
    targetId: newLoc.id,
    targetType: "location",
    details: `Added new service location ${newLoc.name}`
  });

  if (isFirebaseConfigured) {
    await firestoreSaveLocation(newLoc);
  }
}

/**
 * Save Pricing Configuration
 */
export async function syncSavePricing(pricing: PricingConfig): Promise<void> {
  saveAdminPricing(pricing);

  addAuditLog({
    adminEmail: "admin@datemate.in",
    action: "PRICING_UPDATED",
    targetId: pricing.id,
    targetType: "pricing",
    details: `Updated platform booking rates and discount structure`
  });

  if (isFirebaseConfigured) {
    await firestoreSavePricing(pricing);
  }
}

/**
 * Cancel Booking and issue refund record
 */
export async function syncCancelBooking(bookingId: string, reason: string): Promise<void> {
  const bookings = getStoredAdminBookings();
  const b = bookings.find(item => item.id === bookingId);
  if (b) {
    b.status = "cancelled";
    b.cancellationReason = reason;
    b.cancelledAt = new Date().toISOString();
    if (b.paymentStatus === "paid") {
      b.paymentStatus = "refunded";
      // Record refund transaction
      const refundRecord: PaymentTransaction = {
        id: `ref_${Date.now()}`,
        type: "refund",
        referenceId: bookingId,
        customerName: b.clientName,
        amount: b.totalAmount,
        currency: "INR",
        purpose: `Refund for Cancelled Booking #${bookingId}`,
        gateway: "Razorpay",
        gatewayTransactionId: `ref_rzp_${Date.now()}`,
        status: "refunded",
        refundAmount: b.totalAmount,
        refundReason: reason,
        date: new Date().toISOString()
      };
      const payments = getStoredAdminPayments();
      payments.unshift(refundRecord);
      saveAdminPayments(payments);
      if (isFirebaseConfigured) {
        await firestoreSavePayment(refundRecord);
      }
    }
    saveAdminBookings(bookings);

    addAuditLog({
      adminEmail: "admin@datemate.in",
      action: "BOOKING_CANCELLED",
      targetId: bookingId,
      targetType: "booking",
      details: `Cancelled booking #${bookingId}. Reason: ${reason}`
    });

    if (isFirebaseConfigured) {
      await firestoreUpdateBooking(bookingId, {
        status: "cancelled",
        paymentStatus: b.paymentStatus,
        cancellationReason: reason,
        cancelledAt: b.cancelledAt
      });
    }
  }
}

/**
 * Audit Logger Helper
 */
export function addAuditLog(log: Omit<AdminLog, "id" | "timestamp">): void {
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const item: AdminLog = {
    ...log,
    id,
    timestamp: new Date().toISOString()
  };
  const logs = getStoredAdminLogs();
  logs.unshift(item);
  saveAdminLogs(logs.slice(0, 100)); // Keep latest 100 logs

  if (isFirebaseConfigured) {
    firestoreLogAdminAction(log);
  }
}

/**
 * Dashboard High-Level Statistics
 */
export function computeAdminStats() {
  const users = getStoredAdminUsers();
  const partners = getStoredAdminPartners();
  const companions = getStoredAdminCompanions();
  const bookings = getStoredAdminBookings();
  const payments = getStoredAdminPayments();

  const totalUsers = users.length;
  const totalPartners = partners.length;
  const pendingPartners = partners.filter(p => p.status === "pending").length;
  const approvedPartners = partners.filter(p => p.status === "approved").length;
  const rejectedPartners = partners.filter(p => p.status === "rejected" || p.status === "suspended").length;

  const totalCompanions = companions.length;
  const approvedCompanions = companions.filter(c => c.verificationStatus === "approved" && c.isActive).length;
  const availableCompanions = companions.filter(c => c.isAvailable && c.isActive).length;

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending").length;
  const completedBookings = bookings.filter(b => b.status === "completed").length;
  const cancelledBookings = bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length;

  // Revenues
  // ₹99 user registration fee + ₹199 partner registration fee
  const userRegRevenue = payments
    .filter(p => p.type === "user_registration" && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const partnerRegRevenue = payments
    .filter(p => p.type === "partner_registration" && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRegistrationRevenue = userRegRevenue + partnerRegRevenue;

  // Booking revenue
  const totalBookingRevenue = payments
    .filter(p => p.type === "booking" && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  // Platform commission (10% of subtotal from completed or paid bookings)
  const platformCommission = bookings
    .filter(b => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.platformFee || Math.round(b.subtotal * 0.1)), 0);

  return {
    totalUsers,
    totalPartners,
    pendingPartners,
    approvedPartners,
    rejectedPartners,
    totalCompanions,
    approvedCompanions,
    availableCompanions,
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
    totalRegistrationRevenue,
    userRegRevenue,
    partnerRegRevenue,
    totalBookingRevenue,
    platformCommission,
    totalPlatformRevenue: totalRegistrationRevenue + platformCommission
  };
}
