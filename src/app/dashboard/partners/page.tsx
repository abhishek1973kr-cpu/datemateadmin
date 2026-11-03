"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import {
  getStoredAdminPartners,
  syncApprovePartner,
  syncRejectPartner,
  syncSuspendPartner
} from "@/lib/admin-store";
import { isFirebaseConfigured, subscribeToPartners } from "@/lib/firebase";
import { PartnerApplication, PartnerStatus } from "@/lib/types";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  X
} from "lucide-react";

export default function PartnerManagementPage() {
  const [partners, setPartners] = useState<PartnerApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<PartnerApplication | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPartners();

    if (isFirebaseConfigured) {
      const unsub = subscribeToPartners((list) => setPartners(list));
      return () => {
        if (unsub) unsub();
      };
    }
  }, []);

  const loadPartners = () => {
    setPartners(getStoredAdminPartners());
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await syncApprovePartner(id);
      loadPartners();
      setSelectedPartner(null);
    } catch (e: any) {
      alert("Error approving partner: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedPartner) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await syncRejectPartner(selectedPartner.id, rejectionReason.trim());
      loadPartners();
      setRejectModalOpen(false);
      setSelectedPartner(null);
      setRejectionReason("");
    } catch (e: any) {
      alert("Error rejecting partner: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (confirm("Are you sure you want to suspend this partner? Their profile will be removed from User Panel search.")) {
      setActionLoading(true);
      try {
        await syncSuspendPartner(id);
        loadPartners();
        setSelectedPartner(null);
      } catch (e: any) {
        alert("Error suspending partner: " + e.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const filtered = partners.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = p.fullLegalName?.toLowerCase().includes(q);
      const matchCity = p.city?.toLowerCase().includes(q);
      const matchState = p.state?.toLowerCase().includes(q);
      const matchId = p.id?.toLowerCase().includes(q);
      const matchEmail = p.email?.toLowerCase().includes(q);
      return matchName || matchCity || matchState || matchId || matchEmail;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Partner Registration Management"
        subtitle="Review KYC submissions, Aadhaar verification documents, and ₹199 background fee records"
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
              placeholder="Search by Partner ID (e.g. DM-PTR-...), name, city..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
            >
              <option value="all">All Application Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Partners Table */}
        <div className="admin-card p-0 overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partner ID & Applicant</th>
                  <th>Territory</th>
                  <th>Contact Info</th>
                  <th>Identity KYC</th>
                  <th>₹199 Reg Fee</th>
                  <th>Status</th>
                  <th className="text-right">Application Review</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                      No partner applications match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      {/* Applicant & ID */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0 border border-purple-200">
                            {p.photos && p.photos[0] ? (
                              <img
                                src={p.photos[0]}
                                alt={p.fullLegalName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              p.fullLegalName?.slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {p.fullLegalName}
                            </p>
                            <p className="text-[10px] text-purple-700 font-mono font-semibold">
                              {p.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Territory */}
                      <td>
                        <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-500" />
                          <span>{p.city}, {p.state}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div className="space-y-0.5 text-xs text-slate-600">
                          <p>{p.mobile}</p>
                          <p className="text-[11px] text-slate-400">{p.email}</p>
                        </div>
                      </td>

                      {/* Aadhaar Identity KYC */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span className="font-mono text-slate-700 font-semibold">
                            {p.maskedAadhaar || "Verified"}
                          </span>
                        </div>
                      </td>

                      {/* ₹199 Registration Fee */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          {p.feePaid ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>₹199 Paid</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          p.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : p.status === "suspended"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedPartner(p)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          <span>Review Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* APPLICATION DOSSIER MODAL */}
        {selectedPartner && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Partner Application Review
                    </h3>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                      {selectedPartner.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Submitted on {new Date(selectedPartner.submittedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                {/* 1. Photos */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Profile Photographs ({selectedPartner.photos?.length || 0})
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {selectedPartner.photos?.map((photo, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Personal Information */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Applicant Identity & Contact
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400">Full Legal Name:</span>
                      <p className="font-bold text-slate-900">{selectedPartner.fullLegalName}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">DOB / Gender:</span>
                      <p className="font-bold text-slate-900">{selectedPartner.dob || "N/A"} ({selectedPartner.gender})</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Mobile Phone:</span>
                      <p className="font-bold text-slate-900">{selectedPartner.mobile}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Email Address:</span>
                      <p className="font-bold text-slate-900">{selectedPartner.email}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] text-slate-400">Residential Address:</span>
                      <p className="font-bold text-slate-900">{selectedPartner.residentialAddress}, {selectedPartner.city}, {selectedPartner.state} - {selectedPartner.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Identity Verification & Escrow Fee */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Security & KYC Verification
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-purple-50/40 border border-purple-100">
                    <div>
                      <span className="text-[11px] text-slate-400">Aadhaar Card:</span>
                      <p className="font-mono font-bold text-purple-900">{selectedPartner.maskedAadhaar || "Confidential"}</p>
                      <span className="text-[10px] text-slate-400">Encrypted in Admin Vault</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Partner Reg Fee:</span>
                      <p className="font-bold text-emerald-700">₹{selectedPartner.feeAmount || 199} {selectedPartner.feePaid ? "(Paid)" : "(Unpaid)"}</p>
                      <span className="text-[10px] text-slate-400">Txn: {selectedPartner.feeTransactionId || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Bio & Services */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Bio & Booking Configuration
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <p className="italic text-slate-700">{selectedPartner.bio || "No custom bio provided."}</p>
                    <p className="font-semibold text-slate-900">Requested Rate: ₹{selectedPartner.hourlyPrice || 1500}/hr</p>
                  </div>
                </div>

                {selectedPartner.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <strong>Rejection Reason:</strong> {selectedPartner.rejectionReason}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedPartner(null)}
                  className="btn-secondary text-xs"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedPartner.status !== "approved" && (
                    <button
                      onClick={() => handleApprove(selectedPartner.id)}
                      disabled={actionLoading}
                      className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Publish to User Panel</span>
                    </button>
                  )}

                  {selectedPartner.status !== "rejected" && (
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      disabled={actionLoading}
                      className="btn-danger text-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Application</span>
                    </button>
                  )}

                  {selectedPartner.status === "approved" && (
                    <button
                      onClick={() => handleSuspend(selectedPartner.id)}
                      disabled={actionLoading}
                      className="btn-secondary text-xs text-amber-700 hover:bg-amber-50"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Suspend Partner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REJECT PROMPT MODAL */}
        {rejectModalOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-elevated space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Specify Rejection Reason
              </h3>
              <p className="text-xs text-slate-500">
                Please document why {selectedPartner.fullLegalName}&apos;s application is being rejected. This will be recorded in the audit logs.
              </p>

              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Identity documents unreadable, photographs do not meet portrait resolution standards..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  disabled={actionLoading}
                  className="btn-danger text-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
