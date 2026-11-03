"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  computeAdminStats,
  getStoredAdminPartners,
  getStoredAdminBookings,
  getStoredAdminCompanions,
  getStoredAdminUsers,
  syncApprovePartner
} from "@/lib/admin-store";
import {
  isFirebaseConfigured,
  subscribeToBookings,
  subscribeToPartners,
  subscribeToUsers,
  subscribeToCompanions
} from "@/lib/firebase";
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  CalendarCheck,
  TrendingUp,
  CreditCard,
  DollarSign,
  Plus,
  ArrowUpRight,
  Filter,
  ArrowRight,
  Sparkles,
  MapPin,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { PartnerApplication, Booking } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState(computeAdminStats());
  const [recentPartners, setRecentPartners] = useState<PartnerApplication[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    refreshData();

    if (isFirebaseConfigured) {
      const unsubP = subscribeToPartners(() => refreshData());
      const unsubB = subscribeToBookings(() => refreshData());
      const unsubU = subscribeToUsers(() => refreshData());
      const unsubC = subscribeToCompanions(() => refreshData());

      return () => {
        if (unsubP) unsubP();
        if (unsubB) unsubB();
        if (unsubU) unsubU();
        if (unsubC) unsubC();
      };
    }
  }, []);

  const refreshData = () => {
    setStats(computeAdminStats());
    setRecentPartners(getStoredAdminPartners().slice(0, 5));
    setRecentBookings(getStoredAdminBookings().slice(0, 5));
  };

  const handleQuickApprove = async (partnerId: string) => {
    await syncApprovePartner(partnerId);
    refreshData();
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Executive Business Dashboard"
        subtitle="Real-time synchronized analytics, companion metrics, and revenue ledger"
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Date Filter & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              Platform Performance Overview
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter:</span>
            </span>
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => setTimeFilter("all")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeFilter === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter("week")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  timeFilter === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: FINANCIAL & REVENUE METRICS */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Financial & Monetization Ledger
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Registration Revenue */}
            <div className="admin-card border-l-4 border-l-purple-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Total Registration Revenue
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ₹{stats.totalRegistrationRevenue.toLocaleString("en-IN")}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>Users: ₹{stats.userRegRevenue} (₹99 ea)</span>
                <span>•</span>
                <span>Partners: ₹{stats.partnerRegRevenue} (₹199 ea)</span>
              </div>
            </div>

            {/* Total Booking Gross Volume */}
            <div className="admin-card border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Gross Booking Revenue
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ₹{stats.totalBookingRevenue.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Gross companion booking transaction value
              </p>
            </div>

            {/* Platform Commission Earned */}
            <div className="admin-card border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Net Platform Commission
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                ₹{stats.platformCommission.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                10% standard DateMate service commission
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: USER & PARTNER ECOSYSTEM STATS */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Partner Applications & User Ecosystem
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Registered Users */}
            <div className="admin-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Users</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalUsers}
              </p>
              <span className="text-[11px] text-slate-400">Total Registered</span>
            </div>

            {/* Registered Partners */}
            <div className="admin-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Partners</span>
                <UserCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalPartners}
              </p>
              <span className="text-[11px] text-purple-600 font-semibold">Total Applied</span>
            </div>

            {/* Pending Partners */}
            <div className="admin-card p-5 bg-amber-50/40 border-amber-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-800">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-900 mt-2">
                {stats.pendingPartners}
              </p>
              <Link
                href="/dashboard/partners"
                className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>Review Now</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Approved Partners */}
            <div className="admin-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Approved</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.approvedPartners}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">Active Companions</span>
            </div>

            {/* Rejected / Suspended */}
            <div className="admin-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Rejected</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.rejectedPartners}
              </p>
              <span className="text-[11px] text-rose-600">Failed Verification</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: BOOKINGS BREAKDOWN */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Bookings Volume Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="admin-card p-5">
              <span className="text-xs font-medium text-slate-500">Total Bookings</span>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {stats.totalBookings}
              </p>
              <span className="text-[11px] text-slate-400">All Time</span>
            </div>

            <div className="admin-card p-5 border-l-4 border-l-purple-500">
              <span className="text-xs font-medium text-slate-500">Active Bookings</span>
              <p className="text-2xl font-bold text-purple-700 mt-2">
                {stats.activeBookings}
              </p>
              <span className="text-[11px] text-purple-600">Pending / Confirmed</span>
            </div>

            <div className="admin-card p-5 border-l-4 border-l-emerald-500">
              <span className="text-xs font-medium text-slate-500">Completed Dates</span>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {stats.completedBookings}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">100% Fulfilled</span>
            </div>

            <div className="admin-card p-5 border-l-4 border-l-slate-300">
              <span className="text-xs font-medium text-slate-500">Cancelled / Refunded</span>
              <p className="text-2xl font-bold text-slate-700 mt-2">
                {stats.cancelledBookings}
              </p>
              <span className="text-[11px] text-slate-400">Refunded to client</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: QUICK ACTION CALLOUT TO STATE-WISE PARTNER MANAGEMENT */}
        <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider">
                Key Section 5
              </span>
              <h3 className="text-base font-bold text-slate-900">
                State-Wise Companion & Partner Management
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Manage companion cards across 7 designated hubs: Kolkata, Patna, Delhi, Hyderabad, Bangalore, Maharashtra, and Ranchi. Add new companions with direct Cloudinary uploads.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/states"
              className="btn-primary text-xs py-2.5 px-4"
            >
              <MapPin className="w-4 h-4" />
              <span>Open State-Wise Portal</span>
            </Link>
            <Link
              href="/dashboard/companions/new"
              className="btn-secondary text-xs py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Companion</span>
            </Link>
          </div>
        </div>

        {/* SECTION 5: TABLES (PENDING PARTNERS & RECENT BOOKINGS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Applications Review */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Partner Applications
                </h3>
                <p className="text-xs text-slate-500">
                  Aadhaar verification & ₹199 fee review
                </p>
              </div>
              <Link
                href="/dashboard/partners"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPartners.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No applications found
                </div>
              ) : (
                recentPartners.map((partner) => (
                  <div key={partner.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 border border-purple-200">
                        {partner.photos && partner.photos[0] ? (
                          <img
                            src={partner.photos[0]}
                            alt={partner.fullLegalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          partner.fullLegalName.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {partner.fullLegalName}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            partner.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : partner.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {partner.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {partner.city}, {partner.state} • ₹{partner.hourlyPrice || 1500}/hr • Fee: {partner.feePaid ? "₹199 Paid" : "Unpaid"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {partner.status === "pending" && (
                        <button
                          onClick={() => handleQuickApprove(partner.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <Link
                        href={`/dashboard/partners`}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Recent Bookings
                </h3>
                <p className="text-xs text-slate-500">
                  Live user companion reservations
                </p>
              </div>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No bookings found
                </div>
              ) : (
                recentBookings.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">
                          {b.clientName}
                        </p>
                        <span className="text-slate-400 text-xs">with</span>
                        <p className="text-xs font-semibold text-purple-700">
                          {b.companionName}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {b.date} • {b.durationHours} hrs • {b.companionCity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        b.status === "confirmed" || b.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : b.status === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
