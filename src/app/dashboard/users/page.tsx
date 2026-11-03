"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminUsers,
  getStoredAdminBookings,
  syncToggleUserStatus
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToUsers } from "@/lib/firebase";
import { User, Booking } from "@/lib/types";
import {
  Search,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  CalendarCheck,
  MapPin,
  Lock,
  AlertTriangle,
  X,
  CreditCard
} from "lucide-react";

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [feeFilter, setFeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();

    if (isFirebaseConfigured) {
      const unsub = subscribeToUsers((list) => setUsers(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadData = () => {
    setUsers(getStoredAdminUsers());
    setBookings(getStoredAdminBookings());
  };

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    const isSuspending = selectedUser.status !== "suspended";
    setActionLoading(true);

    try {
      await syncToggleUserStatus(
        selectedUser.id,
        isSuspending,
        isSuspending ? suspendReason : undefined
      );
      loadData();
      setSuspendModalOpen(false);
      setSelectedUser(null);
      setSuspendReason("");
    } catch (e: any) {
      alert("Error updating user status: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getUserBookings = (userId: string) => {
    return bookings.filter((b) => b.clientId === userId);
  };

  const filtered = users.filter((u) => {
    if (feeFilter === "paid" && !u.hasPaidRegistrationFee) return false;
    if (feeFilter === "unpaid" && u.hasPaidRegistrationFee) return false;
    if (statusFilter === "active" && u.status === "suspended") return false;
    if (statusFilter === "suspended" && u.status !== "suspended") return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      const matchCity = u.city?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchCity;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="User Account Management"
        subtitle="Manage registered clients, ₹99 registration fee statuses, and booking activities"
      />

      <main className="p-8 space-y-6 max-w-7xl">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user name, email, phone number..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Fee Statuses</option>
              <option value="paid">₹99 Fee Paid</option>
              <option value="unpaid">₹99 Fee Unpaid</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Info</th>
                  <th>Territory / City</th>
                  <th>Registered On</th>
                  <th>₹99 Registration Fee</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const userBookings = getUserBookings(user.id);

                    return (
                      <tr key={user.id}>
                        {/* User Profile */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 border border-purple-200">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name?.slice(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {user.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p>{user.email}</p>
                            <p className="text-[11px] text-slate-400">{user.phone}</p>
                          </div>
                        </td>

                        {/* Territory */}
                        <td>
                          <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-500" />
                            <span>{user.city || "India"}, {user.state || ""}</span>
                          </div>
                        </td>

                        {/* Registered On */}
                        <td>
                          <span className="text-xs text-slate-600">
                            {new Date(user.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </td>

                        {/* ₹99 Registration Fee */}
                        <td>
                          {user.hasPaidRegistrationFee ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>₹99 Paid</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            user.status === "suspended"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {user.status || "active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>Inspect & Bookings</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* USER PROFILE & BOOKING HISTORY MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    User Account Dossier
                  </h3>
                  <p className="text-xs text-slate-400">
                    Client ID: {selectedUser.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                {/* Account Details */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400">Full Name:</span>
                    <p className="font-bold text-slate-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Age:</span>
                    <p className="font-bold text-slate-900">{selectedUser.age || 24} years old</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Email Address:</span>
                    <p className="font-bold text-slate-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Mobile Phone:</span>
                    <p className="font-bold text-slate-900">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">City & State:</span>
                    <p className="font-bold text-slate-900">{selectedUser.city}, {selectedUser.state}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Auth Method:</span>
                    <p className="font-bold text-slate-900 uppercase">{selectedUser.authProvider || "google"}</p>
                  </div>
                </div>

                {/* Password Security Note */}
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2 text-xs text-purple-900">
                  <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Security Policy:</strong> Client passwords are cryptographically hashed and never visible to administrators.
                  </span>
                </div>

                {/* ₹99 Registration Verification Record */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    ₹99 Registration Fee Escrow
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        Status: {selectedUser.hasPaidRegistrationFee ? "Verified & Paid (₹99)" : "Unpaid"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Razorpay Reference: {selectedUser.registrationTransactionId || "N/A"}
                      </p>
                    </div>
                    {selectedUser.hasPaidRegistrationFee && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        Access Authorized
                      </span>
                    )}
                  </div>
                </div>

                {/* Booking History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Booking History ({getUserBookings(selectedUser.id).length})
                  </h4>
                  {getUserBookings(selectedUser.id).length === 0 ? (
                    <p className="p-4 rounded-xl bg-slate-50 text-slate-400 text-center text-xs">
                      No bookings recorded for this client.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getUserBookings(selectedUser.id).map((b) => (
                        <div key={b.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">
                              With {b.companionName} ({b.companionCity})
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {b.date} • {b.durationHours} hrs • {b.activity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{b.totalAmount}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>

                <button
                  onClick={() => setSuspendModalOpen(true)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-colors ${
                    selectedUser.status === "suspended"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  {selectedUser.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUSPEND REASON PROMPT */}
        {suspendModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-elevated space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {selectedUser.status === "suspended" ? "Reactivate Account" : "Confirm Account Suspension"}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedUser.status === "suspended"
                  ? `Reactivate ${selectedUser.name}'s account so they can log in and browse companions again?`
                  : `Please specify the justification for suspending ${selectedUser.name}. They will be barred from booking.`}
              </p>

              {selectedUser.status !== "suspended" && (
                <textarea
                  rows={3}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, policy non-compliance..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                />
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleSuspend}
                  disabled={actionLoading}
                  className="btn-primary text-xs"
                >
                  {selectedUser.status === "suspended" ? "Confirm Reactivation" : "Confirm Suspension"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

