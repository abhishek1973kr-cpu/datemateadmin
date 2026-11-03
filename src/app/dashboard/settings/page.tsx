"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { useAdminAuth } from "@/lib/auth-context";
import {
  getStoredAdminLogs
} from "@/lib/admin-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { AdminLog } from "@/lib/types";
import {
  ShieldCheck,
  Key,
  Lock,
  LogOut,
  Clock,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Save,
  Server
} from "lucide-react";

export default function AdminSettingsPage() {
  const { admin, logout, resetPassword } = useAdminAuth();
  const [logs, setLogs] = useState<AdminLog[]>([]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMessage, setPassMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    setLogs(getStoredAdminLogs());
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPassword.length < 8) {
      setPassMessage({ text: "New password must be at least 8 characters long.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setPassLoading(true);

    try {
      if (admin?.email) {
        const res = await resetPassword(admin.email);
        if (res.success) {
          setPassMessage({
            text: "Password reset request dispatched to " + admin.email + ". Follow the secure link to finalize.",
            type: "success"
          });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          setPassMessage({ text: res.error || "Failed to update password", type: "error" });
        }
      }
    } catch (err: any) {
      setPassMessage({ text: err.message || "An error occurred", type: "error" });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Admin Profile & System Settings"
        subtitle="Administrator credential management, security logs, and cloud infrastructure telemetry"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* SECTION 1: PROFILE INFORMATION */}
        <div className="admin-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {admin?.name?.slice(0, 2) || "AD"}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {admin?.name || "Master Administrator"}
                </h2>
                <p className="text-xs text-slate-400">
                  {admin?.email || "admin@datemate.in"} • Role: <strong className="text-purple-700 uppercase font-semibold">Super Administrator</strong>
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn-danger text-xs py-2 px-3.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400">Security Clearance:</span>
              <p className="font-bold text-slate-900 mt-0.5">Tier 1 Master Admin</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400">Session Initialized:</span>
              <p className="font-bold text-slate-900 mt-0.5">
                {admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400">Authentication Guard:</span>
              <p className="font-bold text-emerald-600 mt-0.5">
                {isFirebaseConfigured ? "Firebase Cloud Auth" : "Local Vault Mode"}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: CHANGE PASSWORD */}
        <div className="admin-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Change Admin Password
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely update administrative password or trigger Firebase password reset link
            </p>
          </div>

          {passMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              passMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {passMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{passMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (Minimum 8 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <Key className="w-4 h-4" />
              <span>{passLoading ? "Processing..." : "Update Password"}</span>
            </button>
          </form>
        </div>

        {/* SECTION 3: CLOUD INFRASTRUCTURE TELEMETRY */}
        <div className="admin-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Connected Infrastructure
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of shared databases, authentication, and media storage
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            {/* Firebase */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span>Google Cloud Firestore</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Shared collection repository with real-time onSnapshot listeners
              </p>
              <div className="font-mono text-[10px] text-purple-700 bg-purple-50 p-1.5 rounded">
                datemate-india
              </div>
            </div>

            {/* Cloudinary */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-purple-600" />
                  <span>Cloudinary Media API</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Folder: datemate/companions/&#123;id&#125;/ with automated public_id destruction
              </p>
              <div className="font-mono text-[10px] text-purple-700 bg-purple-50 p-1.5 rounded">
                Secure Signed Upload Active
              </div>
            </div>

            {/* Razorpay */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Razorpay Payments</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Shared live credentials for ₹99 user fees and ₹199 partner verification
              </p>
              <div className="font-mono text-[10px] text-purple-700 bg-purple-50 p-1.5 rounded">
                rzp_live_Tvn1jy9LtuAo1p
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: AUDIT LOGS */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                System Audit & Security Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable trace of administrative actions taken in this portal
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {logs.length} Actions Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-xs text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs font-semibold text-slate-800">
                          {log.adminEmail}
                        </span>
                      </td>

                      <td>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                          {log.action}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs font-medium text-slate-600 uppercase">
                          {log.targetType}
                        </span>
                      </td>

                      <td>
                        <span className="text-xs text-slate-700 max-w-md truncate block" title={log.details}>
                          {log.details}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
