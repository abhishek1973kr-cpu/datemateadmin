"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminPayments,
  getStoredAdminBookings
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToPayments } from "@/lib/firebase";
import { PaymentTransaction, PaymentType } from "@/lib/types";
import {
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadPayments();

    if (isFirebaseConfigured) {
      const unsub = subscribeToPayments((list) => setPayments(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadPayments = () => {
    setPayments(getStoredAdminPayments());
  };

  const filtered = payments.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = p.id?.toLowerCase().includes(q);
      const matchTxn = p.gatewayTransactionId?.toLowerCase().includes(q);
      const matchName = p.customerName?.toLowerCase().includes(q);
      const matchPurpose = p.purpose?.toLowerCase().includes(q);
      return matchId || matchTxn || matchName || matchPurpose;
    }
    return true;
  });

  const totalCollected = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + (p.refundAmount || p.amount), 0);

  const userFeeCount = payments.filter((p) => p.type === "user_registration" && p.status === "paid").length;
  const partnerFeeCount = payments.filter((p) => p.type === "partner_registration" && p.status === "paid").length;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Payment & Financial Ledger"
        subtitle="Audited transaction logs for ₹99 user fees, ₹199 partner verification fees, bookings and refunds"
      />

      <main className="p-8 space-y-6 max-w-7xl">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="admin-card p-5 border-l-4 border-l-purple-600">
            <span className="text-xs font-semibold text-slate-500">Gross Processed</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{totalCollected.toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-400">Total verified incoming</span>
          </div>

          <div className="admin-card p-5">
            <span className="text-xs font-semibold text-slate-500">User Registrations</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(userFeeCount * 99).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-purple-600 font-semibold">{userFeeCount} payments (₹99 ea)</span>
          </div>

          <div className="admin-card p-5">
            <span className="text-xs font-semibold text-slate-500">Partner Applications</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(partnerFeeCount * 199).toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-purple-600 font-semibold">{partnerFeeCount} payments (₹199 ea)</span>
          </div>

          <div className="admin-card p-5 border-l-4 border-l-rose-500">
            <span className="text-xs font-semibold text-slate-500">Total Refunds</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              ₹{totalRefunded.toLocaleString("en-IN")}
            </p>
            <span className="text-[11px] text-slate-400">Cancelled booking reimbursements</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by transaction ID, customer name, purpose..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Payment Types</option>
              <option value="user_registration">₹99 User Fee</option>
              <option value="partner_registration">₹199 Partner Fee</option>
              <option value="booking">Companion Bookings</option>
              <option value="refund">Refunds</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid & Verified</option>
              <option value="refunded">Refunded</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID & Gateway</th>
                  <th>Customer / Reference</th>
                  <th>Payment Type</th>
                  <th>Purpose</th>
                  <th>Amount (₹)</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                      No payment records match the selected query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      {/* Txn ID */}
                      <td>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <p className="text-xs font-mono font-bold text-slate-900">
                              {t.gatewayTransactionId}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Gateway: {t.gateway}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">{t.customerName}</p>
                          <p className="text-[11px] text-slate-400">{t.customerEmail || t.customerPhone || t.referenceId}</p>
                        </div>
                      </td>

                      {/* Payment Type */}
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === "user_registration"
                            ? "bg-blue-100 text-blue-800"
                            : t.type === "partner_registration"
                            ? "bg-purple-100 text-purple-800"
                            : t.type === "refund"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {t.type === "user_registration"
                            ? "₹99 User Fee"
                            : t.type === "partner_registration"
                            ? "₹199 Partner Fee"
                            : t.type === "refund"
                            ? "Refund"
                            : "Booking"}
                        </span>
                      </td>

                      {/* Purpose */}
                      <td>
                        <span className="text-xs text-slate-600 max-w-xs truncate block" title={t.purpose}>
                          {t.purpose}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className={`text-xs font-bold ${
                          t.status === "refunded" ? "text-rose-600" : "text-slate-900"
                        }`}>
                          {t.status === "refunded" ? "-" : "+"}₹{t.amount?.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="text-xs text-slate-500">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          t.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "refunded"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {t.status}
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
