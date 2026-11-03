"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminBookings,
  syncCancelBooking
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToBookings } from "@/lib/firebase";
import { Booking, BookingStatus } from "@/lib/types";
import {
  Search,
  Filter,
  CalendarCheck,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RotateCcw,
  DollarSign,
  X
} from "lucide-react";

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookings();

    if (isFirebaseConfigured) {
      const unsub = subscribeToBookings((list) => setBookings(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadBookings = () => {
    setBookings(getStoredAdminBookings());
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    setActionLoading(true);

    try {
      await syncCancelBooking(selectedBooking.id, cancelReason.trim());
      loadBookings();
      setCancelModalOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
    } catch (e: any) {
      alert("Error cancelling booking: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (cityFilter !== "all" && !b.companionCity?.toLowerCase().includes(cityFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && b.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = b.id?.toLowerCase().includes(q);
      const matchClient = b.clientName?.toLowerCase().includes(q);
      const matchCompanion = b.companionName?.toLowerCase().includes(q);
      const matchLoc = b.meetingLocation?.toLowerCase().includes(q);
      return matchId || matchClient || matchCompanion || matchLoc;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Companion Booking Management"
        subtitle="Live companion appointments, duration meters, payment reconciliations, and cancellations"
      />

      <main className="p-8 space-y-6 max-w-7xl">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, companion, location..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Territories</option>
              <option value="mumbai">Mumbai / Maharashtra</option>
              <option value="kolkata">Kolkata</option>
              <option value="delhi">Delhi</option>
              <option value="bangalore">Bangalore</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="patna">Patna</option>
              <option value="ranchi">Ranchi</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Booking Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID & Parties</th>
                  <th>Territory & Venue</th>
                  <th>Appointment Time</th>
                  <th>Duration</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                  <th className="text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs text-slate-400">
                      No companion bookings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      {/* Booking ID & Parties */}
                      <td>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-purple-700 px-1.5 py-0.5 bg-purple-50 rounded">
                            {b.id}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-slate-900">{b.clientName}</span>
                            <span className="text-slate-400">with</span>
                            <span className="font-semibold text-purple-700">{b.companionName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div className="text-xs text-slate-700">
                          <p className="font-semibold">{b.companionCity}</p>
                          <p className="text-[11px] text-slate-400 max-w-xs truncate" title={b.meetingLocation}>
                            {b.meetingLocation}
                          </p>
                        </div>
                      </td>

                      {/* Time */}
                      <td>
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p className="font-semibold text-slate-900">{b.date}</p>
                          <p className="text-[11px] text-slate-400">{b.time}</p>
                        </div>
                      </td>

                      {/* Duration */}
                      <td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {b.durationHours} hr{b.durationHours > 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td>
                        <span className="text-xs font-bold text-slate-900">
                          ₹{b.totalAmount?.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Payment */}
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.paymentStatus === "refunded"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          b.status === "confirmed"
                            ? "bg-purple-100 text-purple-800"
                            : b.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {b.status}
                        </span>
                      </td>

                      {/* Manage */}
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOOKING DETAILS & REFUND MODAL */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Booking Information #{selectedBooking.id}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Created on {new Date(selectedBooking.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
                {/* Client & Companion Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400">Client Name:</span>
                    <p className="font-bold text-slate-900">{selectedBooking.clientName}</p>
                    <p className="text-[11px] text-slate-500">{selectedBooking.clientPhone}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Companion:</span>
                    <p className="font-bold text-purple-900">{selectedBooking.companionName}</p>
                    <p className="text-[11px] text-slate-500">{selectedBooking.companionCity}</p>
                  </div>
                </div>

                {/* Date & Location */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Date & Time:</span>
                    <span className="font-bold text-slate-900">{selectedBooking.date} at {selectedBooking.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900">{selectedBooking.durationHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Public Venue:</span>
                    <span className="font-bold text-slate-900">{selectedBooking.meetingLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Activity:</span>
                    <span className="font-bold text-slate-900">{selectedBooking.activity}</span>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Hourly Subtotal:</span>
                    <span>₹{selectedBooking.subtotal?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Commission (10%):</span>
                    <span>+ ₹{selectedBooking.platformFee?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST & Taxes (5%):</span>
                    <span>+ ₹{selectedBooking.tax?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-2 border-t border-purple-200 flex justify-between font-bold text-base text-purple-950">
                    <span>Total Amount:</span>
                    <span>₹{selectedBooking.totalAmount?.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {selectedBooking.cancellationReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <strong>Cancellation Reason:</strong> {selectedBooking.cancellationReason}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>

                {selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="btn-danger text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel & Refund Booking</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CANCEL & REFUND MODAL */}
        {cancelModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-elevated space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Booking #{selectedBooking.id}
              </h3>
              <p className="text-xs text-slate-500">
                This will cancel the reservation and automatically generate a refund entry of <strong>₹{selectedBooking.totalAmount}</strong> in the Payment Ledger.
              </p>

              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (e.g. Mutual client/companion cancellation, venue closed)..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={actionLoading}
                  className="btn-danger text-xs"
                >
                  Confirm Refund & Cancellation
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

