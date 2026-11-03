"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CalendarCheck,
  UserCheck,
  CreditCard,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { AdminNotification } from "@/lib/types";
import {
  getStoredAdminNotifications,
  saveAdminNotifications
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToNotifications } from "@/lib/firebase";

export function RealtimeNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    setNotifications(getStoredAdminNotifications());

    if (isFirebaseConfigured) {
      const unsub = subscribeToNotifications((notifs) => {
        if (notifs.length > 0) {
          setNotifications(notifs);
        }
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    saveAdminNotifications(updated);
  };

  const getIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "partner":
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case "booking":
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case "payment":
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white transition-colors"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-elevated z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Notifications
              </h4>
              <p className="text-[11px] text-slate-400">
                {unreadCount} unread platform alert{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors flex items-start gap-3 ${
                    notif.isRead ? "bg-white" : "bg-purple-50/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => setIsOpen(false)}
                          className="font-semibold text-purple-600 hover:underline flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

