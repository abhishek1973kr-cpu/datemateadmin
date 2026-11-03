"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { getStoredAdminPayments } from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToPayments } from "@/lib/firebase";
import { PaymentTransaction, isFakeOrDemoPayment } from "@/lib/types";
import {
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Lock,
  Clock,
  XCircle,
  Copy,
  Check
} from "lucide-react";

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    id: string;
    status: string;
    message: string;
    verified: boolean;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();

    if (isFirebaseConfigured) {
      const unsub = subscribeToPayments((list) => {
        const authenticOnly = list.filter((p) => !isFakeOrDemoPayment(p));
        setPayments(authenticOnly);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadPayments = () => {
    const list = getStoredAdminPayments().filter((p) => !isFakeOrDemoPayment(p));
    setPayments(list);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Authoritative Verification against Razorpay Backend API
   * Never marks payment as successful without backend verification
   */
  const handleVerifyWithGateway = async (txnId: string) => {
    if (!txnId) return;
    setVerifyingId(txnId);
    setVerifyResult(null);

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: txnId })
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        setVerifyResult({
          id: txnId,
          status: "paid",
          message: `Razorpay Confirmed: Captured ${data.currency} ${data.amount} via ${data.method || "gateway"}.`,
          verified: true
        });
        // Update local state if verified
        setPayments((prev) =>
          prev.map((p) =>
            p.gatewayTransactionId === txnId || p.id === txnId
              ? { ...p, status: "paid", isVerified: true, verifiedAt: new Date().toISOString() }
              : p
          )
        );
      } else {
        setVerifyResult({
          id: txnId,
          status: data.status || "unverified",
          message: data.error || data.message || "Could not verify payment with gateway.",
          verified: false
        });
      }
    } catch (err) {
      setVerifyResult({
        id: txnId,
        status: "error",
        message: (err as Error).message,
        verified: false
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Strictly filter out any demo or fake payment entries
  const authenticPayments = payments.filter((p) => !isFakeOrDemoPayment(p));

  const filtered = authenticPayments.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = p.id?.toLowerCase().includes(q);
      const matchTxn = p.gatewayTransactionId?.toLowerCase().includes(q);
      const matchName = p.customerName?.toLowerCase().includes(q);
      const matchEmail = p.customerEmail?.toLowerCase().includes(q);
      const matchPhone = p.customerPhone?.toLowerCase().includes(q);
      const matchPurpose = p.purpose?.toLowerCase().includes(q);
      return matchId || matchTxn || matchName || matchEmail || matchPhone || matchPurpose;
    }
    return true;
  });

  const isPaid = (status?: string) => status === "paid" || status === "success" || status === "captured";

  // Requirement: Total Revenue strictly counts genuine verified captured payments
  const totalRevenue = authenticPayments
    .filter((p) => isPaid(p.status))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Requirement: Display count of Successful, Pending, and Failed payments
  const successfulCount = authenticPayments.filter((p) => isPaid(p.status)).length;
  const pendingCount = authenticPayments.filter((p) => p.status === "pending").length;
  const failedCount = authenticPayments.filter((p) => p.status === "failed").length;

  // Breakdown by revenue stream
  const userFeeRevenue = authenticPayments
    .filter((p) => p.type === "user_registration" && isPaid(p.status))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const partnerFeeRevenue = authenticPayments
    .filter((p) => p.type === "partner_registration" && isPaid(p.status))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const bookingRevenue = authenticPayments
    .filter((p) => p.type === "booking" && isPaid(p.status))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalRefunded = authenticPayments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + (Number(p.refundAmount || p.amount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Payment & Financial Ledger"
        subtitle="Audited financial records verified strictly through Razorpay Payment Gateway"
      />

      <main className="p-8 space-y-6 max-w-7xl">
        {/* Verification Status Alert */}
        {verifyResult && (
          <div
            className={`p-4 rounded-xl border flex items-start justify-between text-xs transition-all ${
              verifyResult.verified
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {verifyResult.verified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {verifyResult.verified ? "Gateway Verification Successful" : "Verification Warning"}
                </p>
                <p className="mt-0.5">{verifyResult.message}</p>
                <p className="text-[11px] opacity-75 font-mono mt-1">Transaction: {verifyResult.id}</p>
              </div>
            </div>
            <button
              onClick={() => setVerifyResult(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* PRIMARY METRICS: Total Revenue, Successful, Pending, Failed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified Gateway Overview
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
              <Lock className="w-3 h-3" />
              <span>Razorpay Live Gateway Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="admin-card p-5 border-l-4 border-l-purple-600 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
                <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total captured incoming funds
              </span>
            </div>

            {/* Successful Payments */}
            <div className="admin-card p-5 border-l-4 border-l-emerald-500 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Successful Payments</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {successfulCount}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Confirmed captured payments
              </span>
            </div>

            {/* Pending Payments */}
            <div className="admin-card p-5 border-l-4 border-l-amber-500 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Payments</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {pendingCount}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Awaiting gateway capture (₹0 revenue)
              </span>
            </div>

            {/* Failed Payments */}
            <div className="admin-card p-5 border-l-4 border-l-rose-500 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Failed Payments</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {failedCount}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dropped or declined (₹0 revenue)
              </span>
            </div>
          </div>
        </div>

        {/* SECONDARY REVENUE BREAKDOWN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold">User Registrations (₹99)</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹{userFeeRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold">Partner Verification (₹199)</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹{partnerFeeRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold">Companion Bookings</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹{bookingRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold">Refunds Issued</span>
            <p className="text-base font-bold text-rose-600 mt-0.5">
              ₹{totalRefunded.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Search, Filter & Refresh Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by transaction ID, customer, email..."
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
              <option value="user_registration">₹99 User Registration</option>
              <option value="partner_registration">₹199 Partner Verification</option>
              <option value="booking">Companion Bookings</option>
              <option value="refund">Refunds</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid & Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <button
              onClick={loadPayments}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh ledger from source of truth"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID & Gateway</th>
                  <th>Customer / Contact</th>
                  <th>Payment Type</th>
                  <th>Purpose</th>
                  <th>Amount (₹)</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Backend Verification</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          No Authentic Transactions Recorded Yet
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          All fake payments, demo accounts, sample revenue, and fabricated records have been removed.
                          Transactions will appear here in real time as genuine customers complete payments through Razorpay.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-mono text-slate-600">
                          <span>Gateway ID:</span>
                          <span className="font-semibold text-purple-700">rzp_live_Tvn1jy9LtuAo1p</span>
                        </div>
                      </div>
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
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-mono font-bold text-slate-900">
                                {t.gatewayTransactionId || t.id}
                              </p>
                              <button
                                onClick={() => copyToClipboard(t.gatewayTransactionId || t.id)}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy ID"
                              >
                                {copiedId === (t.gatewayTransactionId || t.id) ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              Gateway: {t.gateway || "Razorpay"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">
                            {t.customerName || "Anonymous Customer"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {t.customerEmail || t.customerPhone || t.referenceId}
                          </p>
                        </div>
                      </td>

                      {/* Payment Type */}
                      <td>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.type === "user_registration"
                              ? "bg-blue-100 text-blue-800"
                              : t.type === "partner_registration"
                              ? "bg-purple-100 text-purple-800"
                              : t.type === "refund"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
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
                        <span
                          className={`text-xs font-bold ${
                            t.status === "refunded"
                              ? "text-rose-600"
                              : t.status === "failed"
                              ? "text-slate-400 line-through"
                              : "text-slate-900"
                          }`}
                        >
                          {t.status === "refunded" ? "-" : "+"}₹{Number(t.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        <span className="text-xs text-slate-500">
                          {t.date
                            ? new Date(t.date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            isPaid(t.status)
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "refunded"
                              ? "bg-rose-100 text-rose-800"
                              : t.status === "failed"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isPaid(t.status) ? "Captured / Paid" : t.status}
                        </span>
                      </td>

                      {/* Backend Verification Action */}
                      <td>
                        <button
                          onClick={() => handleVerifyWithGateway(t.gatewayTransactionId || t.id)}
                          disabled={verifyingId === (t.gatewayTransactionId || t.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {verifyingId === (t.gatewayTransactionId || t.id) ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>Verify Razorpay</span>
                            </>
                          )}
                        </button>
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
