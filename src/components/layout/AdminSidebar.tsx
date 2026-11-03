"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Map,
  Users2,
  UserCheck,
  Users,
  MapPin,
  Tag,
  CalendarCheck,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  {
    name: "Overview Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "State-Wise Partners",
    href: "/dashboard/states",
    icon: Map,
    badge: "7 States",
  },
  {
    name: "Companions Directory",
    href: "/dashboard/companions",
    icon: Users2,
    badge: null,
  },
  {
    name: "Partner Applications",
    href: "/dashboard/partners",
    icon: UserCheck,
    badge: "KYC ₹199",
  },
  {
    name: "User Management",
    href: "/dashboard/users",
    icon: Users,
    badge: "Fee ₹99",
  },
  {
    name: "Service Locations",
    href: "/dashboard/locations",
    icon: MapPin,
    badge: null,
  },
  {
    name: "Booking Pricing",
    href: "/dashboard/pricing",
    icon: Tag,
    badge: "Discounts",
  },
  {
    name: "Bookings",
    href: "/dashboard/bookings",
    icon: CalendarCheck,
    badge: null,
  },
  {
    name: "Payments & Ledger",
    href: "/dashboard/payments",
    icon: CreditCard,
    badge: "Razorpay",
  },
  {
    name: "Admin Profile & Logs",
    href: "/dashboard/settings",
    icon: Settings,
    badge: null,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  const userPanelUrl = process.env.NEXT_PUBLIC_USER_PANEL_URL || "http://localhost:3000";

  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">
                DateMate
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Master Control System
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-purple-50 text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-purple-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-purple-200 text-purple-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Live User Panel Link */}
        <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          External Connections
        </div>

        <a
          href={userPanelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition-colors border border-dashed border-slate-200"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Open User Panel</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>

      {/* User Footer with Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase border border-purple-200 shrink-0">
              {admin?.name?.slice(0, 2) || "AD"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {admin?.name || "Administrator"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {admin?.email || "admin@datemate.in"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

