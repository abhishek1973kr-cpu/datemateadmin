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
  AdminNotification,
  isFakeOrDemoPayment
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
// SAFE FIRESTORE DATA SANITIZER
// ============================================================================

/**
 * Recursively removes undefined fields from an object before writing to Firestore.
 * Preserves null, dates, primitives, arrays, and nested structures.
 * Never allows `undefined` to reach Firestore setDoc / updateDoc.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === "object" && item !== null ? sanitizeFirestoreData(item) : item));
  }
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      if (val !== null && typeof val === "object" && !(val instanceof Date)) {
        clean[key] = sanitizeFirestoreData(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

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
 * Strictly sanitizes data to eliminate any undefined fields (e.g. optional partnerId)
 */
export async function firestoreSaveCompanion(companion: Companion): Promise<void> {
  if (!db || !isFirebaseConfigured) return;

  // Validate critical required fields
  if (!companion.id) {
    throw new Error("Cannot save companion without a valid document ID.");
  }
  if (!companion.fullName || !companion.fullName.trim()) {
    throw new Error("Cannot save companion without a full name.");
  }

  try {
    const ref = doc(db, "companions", companion.id);
    const cleanPayload = sanitizeFirestoreData({
      ...companion,
      updatedAt: new Date().toISOString()
    });
    await setDoc(ref, cleanPayload, { merge: true });
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
    const cleanUpdates = sanitizeFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(ref, cleanUpdates);
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
    const cleanUpdates = sanitizeFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(ref, cleanUpdates);
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
    const cleanUpdates = sanitizeFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(ref, cleanUpdates);
  } catch (err) {
    console.error("firestoreUpdateBooking error:", err);
    throw err;
  }
}

/**
 * Real-time listener for Payments
 * Strictly filters out any demo/fake entries so only genuine transactions are received
 */
export function subscribeToPayments(onUpdate: (payments: PaymentTransaction[]) => void): Unsubscribe | null {
  if (!db || !isFirebaseConfigured) return null;
  try {
    const q = collection(db, "payments");
    return onSnapshot(q, (snapshot) => {
      const list: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        const item = { ...doc.data(), id: doc.id } as PaymentTransaction;
        // Never allow demo or fake transactions to enter the Admin Panel
        if (!isFakeOrDemoPayment(item)) {
          list.push(item);
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
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
 * Save Payment transaction (Only genuine verified transactions allowed)
 */
export async function firestoreSavePayment(payment: PaymentTransaction): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  // Strict prevention of saving fake/demo data to Firestore
  if (isFakeOrDemoPayment(payment)) {
    console.warn("Rejected attempt to write demo payment to Firestore:", payment.id);
    return;
  }
  try {
    const ref = doc(db, "payments", payment.id);
    const cleanPayment = sanitizeFirestoreData(payment);
    await setDoc(ref, cleanPayment, { merge: true });
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
    const cleanLocation = sanitizeFirestoreData({
      ...location,
      updatedAt: new Date().toISOString()
    });
    await setDoc(ref, cleanLocation, { merge: true });
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
    const cleanPricing = sanitizeFirestoreData({
      ...pricing,
      updatedAt: new Date().toISOString()
    });
    await setDoc(ref, cleanPricing, { merge: true });
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
    const cleanLog = sanitizeFirestoreData({
      ...log,
      id,
      timestamp: new Date().toISOString()
    });
    await setDoc(ref, cleanLog);
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
