import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser,
  Auth,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
  Unsubscribe
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import {
  User,
  PartnerApplication,
  Companion,
  Booking,
  PaymentTransaction,
  ServiceState,
  PricingConfig,
  AdminLog,
  AdminNotification
} from "./types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("your_") &&
  !firebaseConfig.projectId.includes("your-") &&
  firebaseConfig.apiKey.length > 5
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined" || isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("[DateMate Admin] Firebase initialization notice:", error);
  }
}

export { app, auth, db, storage };

// ============================================================================
// REAL-TIME FIRESTORE REPOSITORY LISTENERS & HELPERS
// ============================================================================

/**
 * Real-time listener for Companions
 */
export function subscribeToCompanions(onUpdate: (companions: Companion[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "companions");
    return onSnapshot(q, (snapshot) => {
      const list: Companion[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Companion);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToCompanions error:", err);
    });
  } catch (e) {
    console.warn("subscribeToCompanions failed:", e);
    return null;
  }
}

/**
 * Save or update companion in Firestore (instantly visible in User Panel)
 */
export async function firestoreSaveCompanion(companion: Companion): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "companions", companion.id);
    await setDoc(ref, {
      ...companion,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("firestoreSaveCompanion error:", err);
    throw err;
  }
}

/**
 * Delete companion from Firestore
 */
export async function firestoreDeleteCompanion(companionId: string): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "companions", companionId);
    await deleteDoc(ref);
  } catch (err) {
    console.error("firestoreDeleteCompanion error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Partner Applications
 */
export function subscribeToPartners(onUpdate: (partners: PartnerApplication[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "partners");
    return onSnapshot(q, (snapshot) => {
      const list: PartnerApplication[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as PartnerApplication);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToPartners error:", err);
    });
  } catch (e) {
    console.warn("subscribeToPartners failed:", e);
    return null;
  }
}

/**
 * Update Partner application status (Approve, Reject, Suspend)
 */
export async function firestoreUpdatePartner(partnerId: string, updates: Partial<PartnerApplication>): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "partners", partnerId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("firestoreUpdatePartner error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Registered Users
 */
export function subscribeToUsers(onUpdate: (users: User[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "users");
    return onSnapshot(q, (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as User);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToUsers error:", err);
    });
  } catch (e) {
    console.warn("subscribeToUsers failed:", e);
    return null;
  }
}

/**
 * Update user status (Suspend / Activate)
 */
export async function firestoreUpdateUser(userId: string, updates: Partial<User>): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("firestoreUpdateUser error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Bookings
 */
export function subscribeToBookings(onUpdate: (bookings: Booking[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "bookings");
    return onSnapshot(q, (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Booking);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToBookings error:", err);
    });
  } catch (e) {
    console.warn("subscribeToBookings failed:", e);
    return null;
  }
}

/**
 * Update booking status or cancellation
 */
export async function firestoreUpdateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "bookings", bookingId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("firestoreUpdateBooking error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Payments
 */
export function subscribeToPayments(onUpdate: (payments: PaymentTransaction[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "payments");
    return onSnapshot(q, (snapshot) => {
      const list: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as PaymentTransaction);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToPayments error:", err);
    });
  } catch (e) {
    console.warn("subscribeToPayments failed:", e);
    return null;
  }
}

/**
 * Save Payment transaction
 */
export async function firestoreSavePayment(payment: PaymentTransaction): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "payments", payment.id);
    await setDoc(ref, payment, { merge: true });
  } catch (err) {
    console.error("firestoreSavePayment error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Locations configuration
 */
export function subscribeToLocations(onUpdate: (locations: ServiceState[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "locations");
    return onSnapshot(q, (snapshot) => {
      const list: ServiceState[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as ServiceState);
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore subscribeToLocations error:", err);
    });
  } catch (e) {
    console.warn("subscribeToLocations failed:", e);
    return null;
  }
}

/**
 * Save Location state
 */
export async function firestoreSaveLocation(location: ServiceState): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "locations", location.id);
    await setDoc(ref, {
      ...location,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("firestoreSaveLocation error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Pricing Configuration
 */
export function subscribeToPricing(onUpdate: (pricing: PricingConfig) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const ref = doc(db, "pricing", "datemate_pricing_config");
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as PricingConfig);
      }
    }, (err) => {
      console.warn("Firestore subscribeToPricing error:", err);
    });
  } catch (e) {
    console.warn("subscribeToPricing failed:", e);
    return null;
  }
}

/**
 * Save Pricing Configuration
 */
export async function firestoreSavePricing(pricing: PricingConfig): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const ref = doc(db, "pricing", "datemate_pricing_config");
    await setDoc(ref, {
      ...pricing,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("firestoreSavePricing error:", err);
    throw err;
  }
}

/**
 * Log Admin Action
 */
export async function firestoreLogAdminAction(log: Omit<AdminLog, "id" | "timestamp">): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  try {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ref = doc(db, "admin_logs", id);
    await setDoc(ref, {
      ...log,
      id,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("firestoreLogAdminAction notice:", err);
  }
}

/**
 * Real-time listener for Admin Notifications
 */
export function subscribeToNotifications(onUpdate: (notifs: AdminNotification[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "notifications");
    return onSnapshot(q, (snapshot) => {
      const list: AdminNotification[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as AdminNotification);
      });
      onUpdate(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      console.warn("Firestore subscribeToNotifications error:", err);
    });
  } catch (e) {
    console.warn("subscribeToNotifications failed:", e);
    return null;
  }
}

