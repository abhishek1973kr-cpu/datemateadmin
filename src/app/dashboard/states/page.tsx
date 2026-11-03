"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminCompanions,
  getStoredAdminPartners,
  getStoredAdminLocations,
  syncToggleLocation,
  syncToggleCompanionStatus
} from "@/lib/admin-store";
import {
  isFirebaseConfigured,
  subscribeToCompanions,
  subscribeToPartners,
  subscribeToLocations
} from "@/lib/firebase";
import { Companion, PartnerApplication, ServiceState } from "@/lib/types";
import {
  MapPin,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Radio,
  Eye,
  ExternalLink,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface HubConfig {
  id: string;
  name: string;
  state: string;
  city: string;
  matchPattern: string;
  badge: string;
  coverImage: string;
}

const DESIGNATED_HUBS: HubConfig[] = [
  {
    id: "wb",
    name: "West Bengal – Kolkata",
    state: "West Bengal",
    city: "Kolkata",
    matchPattern: "kolkata",
    badge: "East Hub",
    coverImage: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "br",
    name: "Bihar – Patna",
    state: "Bihar",
    city: "Patna",
    matchPattern: "patna",
    badge: "Central East",
    coverImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "dl",
    name: "Delhi",
    state: "Delhi",
    city: "Delhi",
    matchPattern: "delhi",
    badge: "National Capital",
    coverImage: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "ts",
    name: "Telangana – Hyderabad",
    state: "Telangana",
    city: "Hyderabad",
    matchPattern: "hyderabad",
    badge: "South Central",
    coverImage: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "ka",
    name: "Karnataka – Bangalore",
    state: "Karnataka",
    city: "Bangalore",
    matchPattern: "bangalore",
    badge: "Tech Capital",
    coverImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "mh",
    name: "Maharashtra – Entire State",
    state: "Maharashtra",
    city: "Maharashtra",
    matchPattern: "maharashtra",
    badge: "West Hub (Mumbai/Pune)",
    coverImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "jh",
    name: "Jharkhand – Ranchi",
    state: "Jharkhand",
    city: "Jharkhand (Ranchi)",
    matchPattern: "ranchi",
    badge: "Plateau Hub",
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  }
];

export default function StateWisePartnersPage() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [partners, setPartners] = useState<PartnerApplication[]>([]);
  const [locations, setLocations] = useState<ServiceState[]>([]);
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  useEffect(() => {
    loadData();

    if (isFirebaseConfigured) {
      const unsubC = subscribeToCompanions((comps) => setCompanions(comps));
      const unsubP = subscribeToPartners((ptrs) => setPartners(ptrs));
      const unsubL = subscribeToLocations((locs) => setLocations(locs));

      return () => {
        if (unsubC) unsubC();
        if (unsubP) unsubP();
        if (unsubL) unsubL();
      };
    }
  }, []);

  const loadData = () => {
    setCompanions(getStoredAdminCompanions());
    setPartners(getStoredAdminPartners());
    setLocations(getStoredAdminLocations());
  };

  const getHubStats = (hub: HubConfig) => {
    const hubCompanions = companions.filter((c) => {
      const city = (c.city || "").toLowerCase();
      const state = (c.state || "").toLowerCase();
      return city.includes(hub.matchPattern) || state.includes(hub.matchPattern) || (hub.id === "mh" && (city.includes("mumbai") || city.includes("pune")));
    });

    const hubPartners = partners.filter((p) => {
      const city = (p.city || "").toLowerCase();
      const state = (p.state || "").toLowerCase();
      return city.includes(hub.matchPattern) || state.includes(hub.matchPattern);
    });

    const totalCompanions = hubCompanions.length;
    const approvedCompanions = hubCompanions.filter((c) => c.verificationStatus === "approved" && c.isActive).length;
    const availableCompanions = hubCompanions.filter((c) => c.isAvailable && c.isActive).length;
    const pendingApplications = hubPartners.filter((p) => p.status === "pending").length;

    // Check location enabled status
    const locDoc = locations.find((l) => l.id === hub.id);
    const isServiceActive = locDoc ? locDoc.isAvailable : true;

    return {
      hubCompanions,
      totalCompanions,
      approvedCompanions,
      pendingApplications,
      availableCompanions,
      isServiceActive
    };
  };

  const handleToggleService = async (hubId: string, current: boolean) => {
    await syncToggleLocation(hubId, !current);
    loadData();
  };

  const handleToggleCompanion = async (compId: string, current: boolean) => {
    await syncToggleCompanionStatus(compId, !current);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="State-Wise Partner Management"
        subtitle="Territorial monitoring, companion availability and direct onboarding across 7 primary hubs"
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

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Territory Overview Notice */}
        <div className="bg-purple-50/60 rounded-2xl border border-purple-200/80 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <h2 className="text-sm font-bold text-slate-900">
                7 Official Operational Territories
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Each state or city column controls live companion counts, background KYC approvals, and territory-level service availability synced in real time to the DateMate User Panel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/locations"
              className="text-xs font-semibold text-purple-700 bg-white px-3 py-2 rounded-xl border border-purple-200 hover:bg-purple-50 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>Configure Locations</span>
            </Link>
          </div>
        </div>

        {/* 7 DESIGNATED STATE & CITY MANAGEMENT CARDS / COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DESIGNATED_HUBS.map((hub, idx) => {
            const stats = getHubStats(hub);

            return (
              <div
                key={hub.id}
                className="admin-card p-0 overflow-hidden flex flex-col justify-between border-slate-200 hover:border-purple-300 transition-all shadow-card hover:shadow-cardHover"
              >
                {/* Header with Hub Tag */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                      #{idx + 1} {hub.badge}
                    </span>
                    <button
                      onClick={() => handleToggleService(hub.id, stats.isServiceActive)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                        stats.isServiceActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                      title={stats.isServiceActive ? "Click to suspend service in this territory" : "Click to activate service"}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stats.isServiceActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                      <span>{stats.isServiceActive ? "Active" : "Suspended"}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {hub.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-purple-500" />
                    <span>{hub.city}, {hub.state}</span>
                  </p>
                </div>

                {/* 4 Statistics: Total, Approved, Pending, Available */}
                <div className="p-5 grid grid-cols-2 gap-3 bg-white">
                  {/* Total Companions */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[11px] font-medium">Total</span>
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 mt-1">
                      {stats.totalCompanions}
                    </p>
                    <span className="text-[10px] text-slate-400">Profiles</span>
                  </div>

                  {/* Approved Companions */}
                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center justify-between text-emerald-800">
                      <span className="text-[11px] font-medium">Approved</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                      {stats.approvedCompanions}
                    </p>
                    <span className="text-[10px] text-emerald-600">Verified</span>
                  </div>

                  {/* Pending Applications */}
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="flex items-center justify-between text-amber-800">
                      <span className="text-[11px] font-medium">Pending</span>
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="text-xl font-bold text-amber-700 mt-1">
                      {stats.pendingApplications}
                    </p>
                    <span className="text-[10px] text-amber-600">KYC check</span>
                  </div>

                  {/* Available Now */}
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center justify-between text-purple-800">
                      <span className="text-[11px] font-medium">Available</span>
                      <Radio className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-xl font-bold text-purple-700 mt-1">
                      {stats.availableCompanions}
                    </p>
                    <span className="text-[10px] text-purple-600">Ready to Book</span>
                  </div>
                </div>

                {/* PROMINENT PLUS (+) BUTTON TO ONBOARD NEW COMPANION IN THIS STATE */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center gap-2">
                  <Link
                    href={`/dashboard/companions/new?state=${encodeURIComponent(hub.state)}&city=${encodeURIComponent(hub.city)}`}
                    className="flex-1 btn-primary text-xs py-2.5 px-3 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-bold">Add Companion</span>
                  </Link>

                  <button
                    onClick={() => setSelectedHub(selectedHub === hub.id ? null : hub.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center ${
                      selectedHub === hub.id
                        ? "bg-purple-100 border-purple-300 text-purple-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    title="View companions in this state"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Companion Roster when Selected */}
                {selectedHub === hub.id && (
                  <div className="p-4 border-t border-purple-100 bg-purple-50/20 divide-y divide-purple-100">
                    <div className="text-[11px] font-bold text-purple-900 mb-2">
                      Companions in {hub.city} ({stats.hubCompanions.length}):
                    </div>
                    {stats.hubCompanions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2 text-center">
                        No companions registered yet. Click &quot;Add Companion&quot; to onboard.
                      </p>
                    ) : (
                      stats.hubCompanions.map((comp) => (
                        <div key={comp.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <img
                              src={comp.photos[0] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                              alt={comp.fullName}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{comp.fullName}</p>
                              <p className="text-[10px] text-slate-400">₹{comp.hourlyPrice}/hr</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleCompanion(comp.id, comp.isActive)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              comp.isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {comp.isActive ? "Active" : "Disabled"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
