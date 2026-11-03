"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Companion, Gender } from "@/lib/types";
import {
  ImageUploadDropzone,
  UploadedPhoto
} from "./ImageUploadDropzone";
import { syncSaveCompanion } from "@/lib/admin-store";
import {
  User,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Home,
  Check,
  AlertCircle,
  Save,
  ArrowLeft
} from "lucide-react";

const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
  "Delhi": ["Delhi", "New Delhi", "Delhi NCR", "Noida", "Gurugram"],
  "Telangana": ["Hyderabad", "Secunderabad", "Warangal"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli"],
  "Maharashtra": ["Maharashtra", "Mumbai", "Pune", "Nagpur", "Thane", "Navi Mumbai"],
  "Jharkhand": ["Jharkhand (Ranchi)", "Ranchi", "Jamshedpur", "Dhanbad"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
  "Rajasthan": ["Jaipur", "Udaipur", "Jodhpur"],
  "Punjab": ["Chandigarh", "Amritsar", "Ludhiana"]
};

interface CompanionFormProps {
  initialCompanion?: Partial<Companion>;
  isEditing?: boolean;
  preselectedState?: string;
  preselectedCity?: string;
}

export function CompanionForm({
  initialCompanion,
  isEditing = false,
  preselectedState,
  preselectedCity,
}: CompanionFormProps) {
  const router = useRouter();

  // Form State
  const companionId = initialCompanion?.id || `comp-${Date.now().toString().slice(-6)}`;

  const [fullName, setFullName] = useState(initialCompanion?.fullName || "");
  const [age, setAge] = useState<number>(initialCompanion?.age || 23);
  const [gender, setGender] = useState<Gender>(initialCompanion?.gender || "female");
  const [mobile, setMobile] = useState(initialCompanion?.mobile || "+91 ");
  const [email, setEmail] = useState(initialCompanion?.email || "");
  const [state, setState] = useState(preselectedState || initialCompanion?.state || "West Bengal");
  const [city, setCity] = useState(preselectedCity || initialCompanion?.city || "Kolkata");
  const [fullAddress, setFullAddress] = useState(initialCompanion?.fullAddress || "");
  const [headline, setHeadline] = useState(
    initialCompanion?.headline || "Warm, conversational & well-mannered companion"
  );
  const [bio, setBio] = useState(initialCompanion?.bio || "");
  const [hourlyPrice, setHourlyPrice] = useState<number>(initialCompanion?.hourlyPrice || 1500);
  const [price30Min, setPrice30Min] = useState<number>(initialCompanion?.price30Min || 900);
  const [languages, setLanguages] = useState<string>(
    initialCompanion?.languages?.join(", ") || "English, Hindi"
  );
  const [interests, setInterests] = useState<string>(
    initialCompanion?.interests?.join(", ") || "Fine Dining, Cinema, Literature"
  );
  const [services, setServices] = useState<string>(
    initialCompanion?.services?.join(", ") || "Fine Dining & Cafes, Cinema & Theater, City Tour & Exploration"
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(initialCompanion?.isAvailable ?? true);
  const [isActive, setIsActive] = useState<boolean>(initialCompanion?.isActive ?? true);

  // Photos State (converted to UploadedPhoto array)
  const initialPhotos: UploadedPhoto[] = (initialCompanion?.photos || []).map((url, i) => ({
    url,
    publicId: initialCompanion?.photoPublicIds?.[i] || undefined,
  }));
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const citiesForState = INDIAN_STATES_CITIES[newState] || [newState];
    setCity(citiesForState[0] || "");
  };

  const handleHourlyPriceChange = (val: number) => {
    setHourlyPrice(val);
    setPrice30Min(Math.round(val * 0.6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim()) {
      setFormError("Full Name is mandatory.");
      return;
    }
    if (age < 18) {
      setFormError("Age must be at least 18 years old (Legal requirement).");
      return;
    }
    if (photos.length < 2) {
      setFormError("Minimum 2 uploaded profile photographs are mandatory before publishing to User Panel.");
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      setFormError("Short Bio must be at least 20 characters long.");
      return;
    }

    setSaving(true);

    try {
      const companionRecord: Companion = {
        id: companionId,
        partnerId: initialCompanion?.partnerId,
        fullName: fullName.trim(),
        age: Number(age),
        gender,
        mobile: mobile.trim(),
        email: email.trim(),
        state: state.trim(),
        city: city.trim(),
        fullAddress: fullAddress.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        hourlyPrice: Number(hourlyPrice),
        price30Min: Number(price30Min),
        rating: initialCompanion?.rating || 5.0,
        reviewCount: initialCompanion?.reviewCount || 0,
        photos: photos.map((p) => p.url),
        photoPublicIds: photos.map((p) => p.publicId || ""),
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
        services: services.split(",").map((s) => s.trim()).filter(Boolean),
        verificationStatus: "approved",
        isAvailable,
        isActive,
        createdAt: initialCompanion?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await syncSaveCompanion(companionRecord);

      // Redirect to companions directory or state-wise hub
      router.push("/dashboard/companions");
    } catch (err: any) {
      setFormError(err.message || "Failed to save companion profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-rose-700 font-medium leading-relaxed">
            {formError}
          </p>
        </div>
      )}

      {/* SECTION 1: PROFILE PHOTOGRAPHS (MANDATORY CLOUDINARY UPLOAD) */}
      <div className="admin-card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Profile Photographs (Cloudinary Integration)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload between 2 and 5 actual portrait photos. Uploads are directly sent to your Cloudinary storage under folder <code className="bg-slate-100 text-purple-700 px-1 py-0.5 rounded">datemate/companions/{companionId}/</code>.
          </p>
        </div>

        <ImageUploadDropzone
          photos={photos}
          onChange={setPhotos}
          companionId={companionId}
          minPhotos={2}
          maxPhotos={5}
        />
      </div>

      {/* SECTION 2: PERSONAL INFORMATION */}
      <div className="admin-card space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Personal Information & Location
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Essential identity and territorial assignment details
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Legal / Profile Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aanya Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Age (18+ Mandatory) *
            </label>
            <input
              type="number"
              min={18}
              max={65}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gender *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="companion@datemate.in"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Operating State *
            </label>
            <select
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            >
              {Object.keys(INDIAN_STATES_CITIES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Operating City / Territory *
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            >
              {(INDIAN_STATES_CITIES[state] || [state]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Full Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Residential / Office Address (Confidential)
            </label>
            <input
              type="text"
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="e.g. Flat 402, Pali Hill, Bandra West"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>
        </div>

        {/* Headline */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Public Headline / Catchphrase *
          </label>
          <input
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Art curator, foodie & enthusiastic conversationalist"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
          />
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Detailed Companion Bio (Public) *
          </label>
          <textarea
            rows={4}
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share personal interests, conversation style, public activities enjoyed..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 leading-relaxed"
          />
        </div>

        {/* Tags: Languages, Interests, Services */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Languages (comma-separated)
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Hindi, Bengali"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Fine Dining, Cinema, Books"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activities / Services
            </label>
            <input
              type="text"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="Fine Dining & Cafes, Cinema"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: BOOKING RATES & AVAILABILITY */}
      <div className="admin-card space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Booking Rates & Real-Time Availability
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rates are synchronized directly to DateMate User Panel for client booking
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* Hourly Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1-Hour Booking Price (₹) *
            </label>
            <input
              type="number"
              min={500}
              step={100}
              required
              value={hourlyPrice}
              onChange={(e) => handleHourlyPriceChange(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* 30-Min Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              30-Minutes Booking Price (₹)
            </label>
            <input
              type="number"
              min={300}
              step={50}
              value={price30Min}
              onChange={(e) => setPrice30Min(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
            />
          </div>

          {/* Is Available Toggle */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-700 mb-2">
              Accepting Bookings Now
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                {isAvailable ? "Available (Online)" : "Unavailable (Offline)"}
              </span>
            </label>
          </div>

          {/* Is Active Toggle */}
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-700 mb-2">
              Public Discovery Status
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                {isActive ? "Visible on User Panel" : "Hidden from Discovery"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* SUBMISSION ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary text-xs py-2.5 px-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          disabled={saving || photos.length < 2}
          className="btn-primary text-xs py-2.5 px-6 shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Synchronizing to Firestore...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? "Save & Sync Changes" : "Publish Companion to User Panel"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
