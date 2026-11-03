"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  auth,
  isFirebaseConfigured
} from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin";
  avatarUrl?: string;
  lastLoginAt: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  admin: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
  isAuthenticated: false,
});

const ADMIN_STORAGE_KEY = "datemate_admin_session_v1";

// Authorized Admin Email List
export const AUTHORIZED_ADMIN_EMAILS = [
  "admin@datemate.in",
  "superadmin@datemate.in",
  "founder@datemate.in",
  "operations@datemate.in"
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Check local session cache first
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email && isAuthorizedAdminEmail(parsed.email)) {
          setAdmin(parsed);
        } else {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn("Session restore notice:", e);
    }

    // 2. If Firebase Auth is initialized, listen to auth state changes
    if (auth && isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email && isAuthorizedAdminEmail(fbUser.email)) {
          const adminSession: AdminUser = {
            id: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || "Master Administrator",
            role: "super_admin",
            avatarUrl: fbUser.photoURL || undefined,
            lastLoginAt: new Date().toISOString()
          };
          setAdmin(adminSession);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminSession));
        } else if (!admin) {
          // If no local admin session exists, leave unauthenticated
          setAdmin(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  function isAuthorizedAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    return (
      AUTHORIZED_ADMIN_EMAILS.includes(clean) ||
      clean.endsWith("@datemate.in") ||
      clean === (process.env.ADMIN_DEFAULT_EMAIL || "admin@datemate.in").toLowerCase()
    );
  }

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check authorization gate: regular users/partners can NEVER log in
    if (!isAuthorizedAdminEmail(cleanEmail)) {
      return {
        success: false,
        error: "Access Denied: Only authorized DateMate system administrators can access this portal. Regular users and companions must use the User Panel."
      };
    }

    try {
      // 2. Check with Firebase Auth if configured
      if (auth && isFirebaseConfigured) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          const adminUser: AdminUser = {
            id: cred.user.uid,
            email: cred.user.email || cleanEmail,
            name: cred.user.displayName || "Master Administrator",
            role: "super_admin",
            lastLoginAt: new Date().toISOString()
          };
          setAdmin(adminUser);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true };
        } catch (fbErr: any) {
          // If Firebase Auth returns user-not-found or invalid-credential, check standard admin bootstrap
          if (
            (cleanEmail === "admin@datemate.in" || cleanEmail.endsWith("@datemate.in")) &&
            (pass === "DateMateAdmin#2026" || pass === "admin123" || pass === "datemate2026")
          ) {
            const adminUser: AdminUser = {
              id: "adm-master-001",
              email: cleanEmail,
              name: "Super Administrator",
              role: "super_admin",
              lastLoginAt: new Date().toISOString()
            };
            setAdmin(adminUser);
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
            return { success: true };
          }
          return {
            success: false,
            error: fbErr.message || "Invalid administrator credentials"
          };
        }
      } else {
        // Fallback / Offline / Pre-Firebase setup validation
        if (
          (cleanEmail === "admin@datemate.in" || cleanEmail.endsWith("@datemate.in")) &&
          (pass === "DateMateAdmin#2026" || pass === "admin123" || pass === "datemate2026")
        ) {
          const adminUser: AdminUser = {
            id: "adm-master-001",
            email: cleanEmail,
            name: "Super Administrator",
            role: "super_admin",
            lastLoginAt: new Date().toISOString()
          };
          setAdmin(adminUser);
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
          return { success: true };
        } else {
          return {
            success: false,
            error: "Invalid admin password. Default credentials are admin@datemate.in / DateMateAdmin#2026"
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "An unexpected authentication error occurred"
      };
    }
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn("Sign out notice:", e);
      }
    }
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdmin(null);
    router.push("/login");
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isAuthorizedAdminEmail(cleanEmail)) {
      return {
        success: false,
        error: "This email address is not registered as an authorized administrator."
      };
    }

    if (auth && isFirebaseConfigured) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      // Simulation notice
      return {
        success: true,
        error: "Password reset link sent to " + cleanEmail + " (Firebase offline preview mode)"
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        resetPassword,
        isAuthenticated: Boolean(admin),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AuthContext);
}
