"use client";

import React from "react";
import Link from "next/link";
import { Plus, Radio, Database } from "lucide-react";
import { RealtimeNotificationBell } from "./RealtimeNotificationBell";
import { isFirebaseConfigured } from "@/lib/firebase";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Firestore Realtime Connection Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-purple-600" />
          <span>
            {isFirebaseConfigured ? "Firestore Live Sync" : "Local Sync Ready"}
          </span>
        </div>

        {/* Realtime Notification Bell */}
        <RealtimeNotificationBell />

        {/* Custom Actions (e.g., Add New Companion) */}
        {actions || (
          <Link
            href="/dashboard/companions/new"
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Companion</span>
          </Link>
        )}
      </div>
    </header>
  );
}

