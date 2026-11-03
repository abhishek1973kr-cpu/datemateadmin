"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminPricing,
  syncSavePricing
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToPricing } from "@/lib/firebase";
import { PricingConfig, PricingTier } from "@/lib/types";
import {
  Tag,
  Save,
  CheckCircle2,
  Percent,
  Calculator,
  AlertCircle,
  Clock,
  Sparkles,
  DollarSign
} from "lucide-react";

export default function PricingManagementPage() {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(getStoredAdminPricing());
  const [tiers, setTiers] = useState<PricingTier[]>(pricingConfig.tiers);
  const [platformFee, setPlatformFee] = useState(pricingConfig.platformFeePercent || 10);
  const [taxPercent, setTaxPercent] = useState(pricingConfig.taxPercent || 5);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calculator simulator
  const [simTier, setSimTier] = useState<string>("tier-2h");

  useEffect(() => {
    loadPricing();

    if (isFirebaseConfigured) {
      const unsub = subscribeToPricing((cfg) => {
        setPricingConfig(cfg);
        setTiers(cfg.tiers);
        setPlatformFee(cfg.platformFeePercent || 10);
        setTaxPercent(cfg.taxPercent || 5);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadPricing = () => {
    const cfg = getStoredAdminPricing();
    setPricingConfig(cfg);
    setTiers(cfg.tiers);
    setPlatformFee(cfg.platformFeePercent || 10);
    setTaxPercent(cfg.taxPercent || 5);
  };

  const handlePriceChange = (index: number, newFinalPrice: number) => {
    const updated = [...tiers];
    const t = updated[index];
    t.finalPrice = newFinalPrice;

    // Recalculate discount percent if regular price > 0
    if (t.regularPrice > 0) {
      const diff = t.regularPrice - newFinalPrice;
      const discount = Math.max(0, (diff / t.regularPrice) * 100);
      t.discountPercent = Number(discount.toFixed(2));
    }

    setTiers(updated);
  };

  const handleRegularPriceChange = (index: number, newRegularPrice: number) => {
    const updated = [...tiers];
    const t = updated[index];
    t.regularPrice = newRegularPrice;

    if (newRegularPrice > 0 && t.finalPrice <= newRegularPrice) {
      const diff = newRegularPrice - t.finalPrice;
      const discount = Math.max(0, (diff / newRegularPrice) * 100);
      t.discountPercent = Number(discount.toFixed(2));
    }
    setTiers(updated);
  };

  const handleDiscountChange = (index: number, newDiscountPercent: number) => {
    const updated = [...tiers];
    const t = updated[index];
    t.discountPercent = newDiscountPercent;
    const finalVal = Math.round(t.regularPrice * (1 - newDiscountPercent / 100));
    t.finalPrice = finalVal;
    setTiers(updated);
  };

  const handleToggleTier = (index: number) => {
    const updated = [...tiers];
    updated[index].isEnabled = !updated[index].isEnabled;
    setTiers(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const newConfig: PricingConfig = {
        id: "datemate_pricing_config",
        updatedAt: new Date().toISOString(),
        platformFeePercent: Number(platformFee),
        taxPercent: Number(taxPercent),
        tiers,
      };

      await syncSavePricing(newConfig);
      setPricingConfig(newConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert("Error saving pricing config: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Compute simulation breakdown
  const activeSimTier = tiers.find((t) => t.id === simTier) || tiers[1];
  const simSubtotal = activeSimTier.finalPrice;
  const simPlatformFee = Math.round(simSubtotal * (platformFee / 100));
  const simTax = Math.round(simSubtotal * (taxPercent / 100));
  const simTotal = simSubtotal + simPlatformFee + simTax;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Booking Pricing & Discount Management"
        subtitle="Configure duration tiers, tiered discounts, and platform fees synchronized to Firestore"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Sync to Firestore</span>
              </>
            )}
          </button>
        }
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs sm:text-sm text-emerald-800 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Pricing configuration saved successfully to Firestore! The DateMate User Panel will read these updated rates automatically.
            </span>
          </div>
        )}

        {/* SECTION 1: GLOBAL PLATFORM FEE & TAXES */}
        <div className="admin-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Platform Commission & Taxes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated on top of companion booking subtotal
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Shared Firestore Config
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Platform Service Fee (%)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standard DateMate fee is 10%</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GST / Applicable Government Tax (%)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standard GST is 5%</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: DURATION TIERS & DISCOUNT STRUCTURE */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Booking Duration Tiers (Max 5 Hours)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define regular price vs discounted customer price for each slot
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
              6 Configurable Slots
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking Duration</th>
                  <th>Regular Hourly Price (₹)</th>
                  <th>Discount (%)</th>
                  <th>Final Customer Price (₹)</th>
                  <th>Savings Tag</th>
                  <th>Status in User Panel</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, idx) => (
                  <tr key={tier.id}>
                    {/* Duration Label */}
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{tier.label}</p>
                          <p className="text-[10px] text-slate-400">
                            {tier.durationMinutes} minutes ({tier.durationHours} hr)
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Regular Price */}
                    <td>
                      <div className="relative w-28">
                        <input
                          type="number"
                          value={tier.regularPrice}
                          onChange={(e) => handleRegularPriceChange(idx, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                        />
                      </div>
                    </td>

                    {/* Discount % */}
                    <td>
                      <div className="relative w-24">
                        <input
                          type="number"
                          step="0.01"
                          value={tier.discountPercent}
                          onChange={(e) => handleDiscountChange(idx, Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Final Price */}
                    <td>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={tier.finalPrice}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-purple-50/30"
                        />
                      </div>
                    </td>

                    {/* Savings Tag */}
                    <td>
                      {tier.discountPercent > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Save ₹{tier.regularPrice - tier.finalPrice} ({tier.discountPercent}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Standard</span>
                      )}
                    </td>

                    {/* Enabled Toggle */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleTier(idx)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
                          tier.isEnabled
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${tier.isEnabled ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                        <span>{tier.isEnabled ? "Available in App" : "Disabled"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: INTERACTIVE USER PANEL SIMULATOR */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              User Panel Booking Breakdown Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Preview the exact mathematical bill presented to the user when booking a companion:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Duration Slot:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {tiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSimTier(t.id)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      simTier === t.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:border-purple-300"
                    }`}
                  >
                    <p className="font-bold">{t.label}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">₹{t.finalPrice}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Preview Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Base Companion Rate ({activeSimTier.label}):</span>
                <span>₹{simSubtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Platform Fee ({platformFee}%):</span>
                <span>+ ₹{simPlatformFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Taxes & GST ({taxPercent}%):</span>
                <span>+ ₹{simTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-base text-purple-900">
                <span>Total Client Payable:</span>
                <span>₹{simTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

