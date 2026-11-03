export type UserRole = 'client' | 'companion' | 'admin' | 'user' | 'partner';

export const SUPPORTED_LOCATIONS = [
  "Kolkata",
  "Patna",
  "Delhi",
  "Hyderabad",
  "Bangalore",
  "Maharashtra",
  "Jharkhand (Ranchi)"
] as const;

export type SupportedLocation = (typeof SUPPORTED_LOCATIONS)[number];

export interface ServiceState {
  id: string;
  name: string;
  cityFilter: string;
  isAvailable: boolean;
  state?: string;
  city?: string;
  updatedAt?: string;
}

export const INITIAL_SERVICE_STATES: ServiceState[] = [
  { id: "wb", name: "West Bengal – Kolkata", cityFilter: "Kolkata", state: "West Bengal", city: "Kolkata", isAvailable: true },
  { id: "br", name: "Bihar – Patna", cityFilter: "Patna", state: "Bihar", city: "Patna", isAvailable: true },
  { id: "dl", name: "Delhi", cityFilter: "Delhi", state: "Delhi", city: "Delhi", isAvailable: true },
  { id: "ts", name: "Telangana – Hyderabad", cityFilter: "Hyderabad", state: "Telangana", city: "Hyderabad", isAvailable: true },
  { id: "ka", name: "Karnataka – Bangalore", cityFilter: "Bangalore", state: "Karnataka", city: "Bangalore", isAvailable: true },
  { id: "mh", name: "Maharashtra – Entire State", cityFilter: "Maharashtra", state: "Maharashtra", city: "Mumbai / Pune", isAvailable: true },
  { id: "jh", name: "Jharkhand – Ranchi", cityFilter: "Jharkhand (Ranchi)", state: "Jharkhand", city: "Ranchi", isAvailable: true },
  // Additional States
  { id: "up", name: "Uttar Pradesh", cityFilter: "Uttar Pradesh", state: "Uttar Pradesh", city: "Lucknow", isAvailable: false },
  { id: "tn", name: "Tamil Nadu", cityFilter: "Tamil Nadu", state: "Tamil Nadu", city: "Chennai", isAvailable: false },
  { id: "gj", name: "Gujarat", cityFilter: "Gujarat", state: "Gujarat", city: "Ahmedabad", isAvailable: false },
  { id: "rj", name: "Rajasthan", cityFilter: "Rajasthan", state: "Rajasthan", city: "Jaipur", isAvailable: false },
  { id: "pb", name: "Punjab", cityFilter: "Punjab", state: "Punjab", city: "Chandigarh", isAvailable: false },
  { id: "kl", name: "Kerala", cityFilter: "Kerala", state: "Kerala", city: "Kochi", isAvailable: false },
  { id: "mp", name: "Madhya Pradesh", cityFilter: "Madhya Pradesh", state: "Madhya Pradesh", city: "Bhopal", isAvailable: false }
];

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  passwordHash?: string;
  phone: string;
  role: UserRole;
  age: number;
  dob?: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  isAgeVerified: boolean;
  authProvider?: 'google' | 'credentials' | 'admin' | 'demo';
  googleVerified?: boolean;
  hasPaidRegistrationFee?: boolean; // User Registration Fee: ₹99
  registrationTransactionId?: string;
  registrationFeeAmount?: number;
  registrationFeePaidAt?: string;
  partnerId?: string;
  status?: 'active' | 'suspended';
  suspensionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export type Gender = 'female' | 'male' | 'other';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface PartnerApplication {
  id: string; // e.g. "DM-PTR-83921"
  userId?: string;
  username?: string;
  passwordHash?: string;
  googleVerified?: boolean;
  googleEmail?: string;
  // Step 1: Personal Details
  fullLegalName: string;
  dob: string;
  gender: Gender;
  mobile: string;
  email: string;
  residentialAddress: string;
  city: string;
  state: string;
  pincode: string;
  // Step 2: Profile Photos (2 to 5)
  photos: string[];
  photoPublicIds?: string[]; // Cloudinary public_ids
  // Step 3: Identity Verification (Aadhaar)
  aadhaarNumber: string; // full number (private)
  maskedAadhaar: string; // "XXXX-XXXX-1234"
  aadhaarDocumentUrl: string; // private storage url or document data
  aadhaarConsent: boolean;
  // Step 4: Partner Registration Fee (₹199)
  feeAmount: number; // 199
  feePaid: boolean;
  feeTransactionId?: string;
  feePaidAt?: string;
  // Step 5: Application Status & Profile Info
  status: PartnerStatus;
  rejectionReason?: string;
  submittedAt: string;
  approvedAt?: string;
  headline?: string;
  bio?: string;
  hourlyPrice?: number;
  price30Min?: number;
  services?: string[];
  languages?: string[];
  interests?: string[];
  isAvailable?: boolean;
  isActive?: boolean;
  companionId?: string;
}

export interface CompanionImage {
  url: string;
  publicId?: string;
  isPrimary?: boolean;
}

export interface Companion {
  id: string;
  userId?: string;
  partnerId?: string;
  fullName: string;
  gender: Gender;
  age: number;
  email?: string;
  mobile?: string;
  fullAddress?: string;
  city: string;
  state?: string;
  locationId?: string;
  headline: string;
  bio: string;
  price30Min?: number;
  hourlyPrice: number;
  rating: number;
  reviewCount: number;
  photos: string[];
  photoPublicIds?: string[];
  images?: CompanionImage[];
  languages: string[];
  interests: string[];
  services: string[];
  verificationStatus: VerificationStatus;
  isAvailable: boolean;
  isActive: boolean; // Admin can disable companion without breaking past bookings
  idProofType?: string;
  idProofNumber?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  companionId: string;
  companionName: string;
  companionPhoto: string;
  companionCity: string;
  date: string;
  time: string;
  durationHours: number;
  activity: string;
  meetingLocation: string;
  hourlyPrice: number;
  subtotal: number;
  platformFee: number;
  tax: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  specialNotes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PricingTier {
  id: string;
  durationMinutes: number;
  durationHours: number;
  label: string;
  regularPrice: number;
  discountPercent: number;
  finalPrice: number;
  isEnabled: boolean;
}

export interface PricingConfig {
  id: string; // 'datemate_pricing_config'
  updatedAt: string;
  platformFeePercent: number; // 10%
  taxPercent: number; // 5%
  tiers: PricingTier[];
}

export const INITIAL_PRICING_CONFIG: PricingConfig = {
  id: "datemate_pricing_config",
  updatedAt: new Date().toISOString(),
  platformFeePercent: 10,
  taxPercent: 5,
  tiers: [
    {
      id: "tier-30m",
      durationMinutes: 30,
      durationHours: 0.5,
      label: "30 Minutes",
      regularPrice: 600,
      discountPercent: 0,
      finalPrice: 600,
      isEnabled: true
    },
    {
      id: "tier-1h",
      durationMinutes: 60,
      durationHours: 1,
      label: "1 Hour",
      regularPrice: 1200,
      discountPercent: 0,
      finalPrice: 1200,
      isEnabled: true
    },
    {
      id: "tier-2h",
      durationMinutes: 120,
      durationHours: 2,
      label: "2 Hours",
      regularPrice: 2400,
      discountPercent: 16.67,
      finalPrice: 2000,
      isEnabled: true
    },
    {
      id: "tier-3h",
      durationMinutes: 180,
      durationHours: 3,
      label: "3 Hours",
      regularPrice: 3600,
      discountPercent: 25,
      finalPrice: 2700,
      isEnabled: true
    },
    {
      id: "tier-4h",
      durationMinutes: 240,
      durationHours: 4,
      label: "4 Hours",
      regularPrice: 4800,
      discountPercent: 29.17,
      finalPrice: 3400,
      isEnabled: true
    },
    {
      id: "tier-5h",
      durationMinutes: 300,
      durationHours: 5,
      label: "5 Hours (Max)",
      regularPrice: 6000,
      discountPercent: 33.33,
      finalPrice: 4000,
      isEnabled: true
    }
  ]
};

export type PaymentType = 'user_registration' | 'partner_registration' | 'booking' | 'refund';

export interface PaymentTransaction {
  id: string;
  type: PaymentType;
  referenceId: string; // userId, partnerId, or bookingId
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  purpose: string;
  gateway: 'Razorpay' | 'Direct';
  gatewayTransactionId: string;
  gatewayOrderId?: string;
  status: 'paid' | 'pending' | 'refunded' | 'failed';
  refundAmount?: number;
  refundReason?: string;
  date: string;
}

export interface Review {
  id: string;
  companionId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment: string;
  activity: string;
  date: string;
}

export interface AdminLog {
  id: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: 'companion' | 'partner' | 'user' | 'pricing' | 'location' | 'booking';
  details: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'partner' | 'booking' | 'payment' | 'user' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}
