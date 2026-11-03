"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminLocations,
  syncToggleLocation,
  syncAddLocation
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToLocations } from "@/lib/firebase";
import { ServiceState } from "@/lib/types";
import {
  MapPin,
  Plus,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Search,
  Building,
  Save,
  X
} from "lucide-react";

export default function ServiceLocationManagementPage() {
  const [locations, setLocations] = useState<ServiceState[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAvailable, setNewAvailable] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadLocations();

    if (isFirebaseConfigured) {
      const unsub = subscribeToLocations((list) => setLocations(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadLocations = () => {
    setLocations(getStoredAdminLocations());
  };

  const handleToggle = async (id: string, current: boolean) => {
    setActionLoading(true);
    try {
      await syncToggleLocation(id, !current);
      loadLocations();
    } catch (e: any) {
      alert("Error updating location availability: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) {
      alert("Please provide location name and city.");
      return;
    }

    const id = newCity.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);

    const newLoc: ServiceState = {
      id,
      name: newName.trim(),
      cityFilter: newCity.trim(),
      state: newState.trim(),
      city: newCity.trim(),
      isAvailable: newAvailable,
      updatedAt: new Date().toISOString()
    };

    setActionLoading(true);
    try {
      await syncAddLocation(newLoc);
      loadLocations();
      setIsAddModalOpen(false);
      setNewName("");
      setNewState("");
      setNewCity("");
      setNewAvailable(true);
    } catch (e: any) {
      alert("Error adding location: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = locations.filter((loc) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        loc.name?.toLowerCase().includes(q) ||
        loc.cityFilter?.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q) ||
        loc.state?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Service Location Management"
        subtitle="Territorial switches saved to Firestore and automatically synchronized with the DateMate User Panel"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Location</span>
          </button>
        }
      />

      <main className="p-8 space-y-6 max-w-7xl">
        {/* Banner with Unavailable Message Guarantee */}
        <div className="p-6 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-2">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
            <Building className="w-4 h-4 text-purple-600" />
            <span>Centralized Territorial Dispatch Engine</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            When an administrator disables a state or city here, the change is written directly to Firestore. The DateMate User Panel immediately blocks bookings in that location and displays:
          </p>
          <div className="p-3 bg-white rounded-xl border border-purple-200/90 text-xs text-slate-800 font-medium">
            &ldquo;Sorry! Our service is currently not available in your location.&rdquo;
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search territory or city..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} locations ({filtered.filter(l => l.isAvailable).length} Active)
          </div>
        </div>

        {/* Locations Grid / Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Territory Name</th>
                <th>City Filter</th>
                <th>State</th>
                <th>User Panel Status</th>
                <th>Service Availability Switch</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        loc.isAvailable ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-400"
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{loc.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{loc.id}</p>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="text-xs text-slate-700 font-medium">
                      {loc.cityFilter}
                    </span>
                  </td>

                  <td>
                    <span className="text-xs text-slate-600">
                      {loc.state || "India"}
                    </span>
                  </td>

                  <td>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 w-fit ${
                      loc.isAvailable
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${loc.isAvailable ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                      <span>{loc.isAvailable ? "Operational" : "Unavailable (Coming Soon)"}</span>
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => handleToggle(loc.id, loc.isAvailable)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        loc.isAvailable
                          ? "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {loc.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Enabled in App</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Disabled (Offline)</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="text-right">
                    <button
                      onClick={() => handleToggle(loc.id, loc.isAvailable)}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ADD LOCATION MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-elevated space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Add New Service Territory
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLocation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Goa – Panaji & North Coast"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City / Filter Keyword *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g. Goa"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="e.g. Goa"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newAvailable}
                      onChange={(e) => setNewAvailable(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300"
                    />
                    <span>Launch as Available in User Panel Immediately</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to Firestore</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
