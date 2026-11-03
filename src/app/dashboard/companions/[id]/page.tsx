"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { CompanionForm } from "@/components/companions/CompanionForm";
import { getStoredAdminCompanions } from "@/lib/admin-store";
import { Companion } from "@/lib/types";

export default function EditCompanionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const list = getStoredAdminCompanions();
      const found = list.find((c) => c.id === id);
      if (found) {
        setCompanion(found);
      }
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <AdminHeader title="Loading Companion Profile..." />
        <div className="p-8 text-center text-xs text-slate-500">Retrieving companion data...</div>
      </div>
    );
  }

  if (!companion) {
    return (
      <div className="flex-1 flex flex-col bg-white">
        <AdminHeader title="Companion Not Found" />
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-slate-600">No companion profile exists with ID: {id}</p>
          <button
            onClick={() => router.push("/dashboard/companions")}
            className="btn-primary text-xs mx-auto"
          >
            Return to Companions Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title={`Edit Companion: ${companion.fullName}`}
        subtitle={`ID: ${companion.id} • Assigned to ${companion.city}`}
      />

      <main className="p-8 max-w-5xl">
        <CompanionForm
          initialCompanion={companion}
          isEditing={true}
        />
      </main>
    </div>
  );
}
