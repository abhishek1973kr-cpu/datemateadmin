"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminCompanions,
  syncDeleteCompanion,
  syncToggleCompanionStatus
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToCompanions } from "@/lib/firebase";
import { Companion } from "@/lib/types";
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Star,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  Radio
} from "lucide-react";

export default function CompanionsDirectoryPage() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCompanions();

    if (isFirebaseConfigured) {
      const unsub = subscribeToCompanions((list) => setCompanions(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadCompanions = () => {
    setCompanions(getStoredAdminCompanions());
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete companion ${name}? Existing bookings will not be broken.`)) {
      await syncDeleteCompanion(id);
      loadCompanions();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await syncToggleCompanionStatus(id, !current);
    loadCompanions();
  };

  const filtered = companions.filter((c) => {
    if (cityFilter !== "all" && !c.city.toLowerCase().includes(cityFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter === "active" && !c.isActive) return false;
    if (statusFilter === "disabled" && c.isActive) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchCity = c.city.toLowerCase().includes(q);
      const matchBio = c.bio.toLowerCase().includes(q);
      return matchName || matchCity || matchBio;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Companions Directory"
        subtitle={`Managing ${companions.length} public and private companion profiles with live User Panel sync`}
        actions={
          <Link
            href="/dashboard/companions/new"
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Companion</span>
          </Link>
        }
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
              placeholder="Search by companion name, city, bio..."
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
              <option value="kolkata">Kolkata</option>
              <option value="patna">Patna</option>
              <option value="delhi">Delhi</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="bangalore">Bangalore</option>
              <option value="maharashtra">Maharashtra</option>
              <option value="ranchi">Ranchi</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Visible)</option>
              <option value="disabled">Disabled (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Companions Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Companion</th>
                  <th>Territory / City</th>
                  <th>Hourly Rate</th>
                  <th>Rating</th>
                  <th>Photos</th>
                  <th>Discovery Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                      No companions match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      {/* Companion Info */}
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={c.photos[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                            alt={c.fullName}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {c.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Age: {c.age} • {c.gender}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          <span>{c.city}</span>
                        </div>
                      </td>

                      {/* Hourly Rate */}
                      <td>
                        <span className="text-xs font-bold text-slate-900">
                          ₹{c.hourlyPrice?.toLocaleString("en-IN") || 1500}
                        </span>
                        <span className="text-[10px] text-slate-400"> / hr</span>
                      </td>

                      {/* Rating */}
                      <td>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{c.rating?.toFixed(1) || "5.0"}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({c.reviewCount || 0})
                          </span>
                        </div>
                      </td>

                      {/* Photos Count */}
                      <td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.photos?.length || 0} Cloudinary
                        </span>
                      </td>

                      {/* Discovery Status */}
                      <td>
                        <button
                          onClick={() => handleToggleActive(c.id, c.isActive)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors ${
                            c.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                          }`}
                          title={c.isActive ? "Click to hide from User Panel" : "Click to publish on User Panel"}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                          <span>{c.isActive ? "Live in App" : "Hidden / Disabled"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/companions/${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit details"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(c.id, c.fullName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete companion profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
