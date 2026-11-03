"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { CompanionForm } from "@/components/companions/CompanionForm";

function NewCompanionContent() {
  const searchParams = useSearchParams();
  const preState = searchParams.get("state") || undefined;
  const preCity = searchParams.get("city") || undefined;

  return (
    <div className="flex-1 flex flex-col bg-white">
      <AdminHeader
        title="Onboard New Companion"
        subtitle="Create validated companion profile with Cloudinary photo storage and instant User Panel synchronization"
      />

      <main className="p-8 max-w-5xl">
        <CompanionForm
          preselectedState={preState}
          preselectedCity={preCity}
        />
      </main>
    </div>
  );
}

export default function NewCompanionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading onboard wizard...</div>}>
      <NewCompanionContent />
    </Suspense>
  );
}
