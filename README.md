# DateMate – Master Admin Panel

**Enterprise Executive Administration Portal for DateMate India**

The **DateMate Master Admin Panel** is a dedicated administrative application designed for full-lifecycle companion verification, territorial management, pricing controls, and real-time revenue analytics. It connects directly to the existing **DateMate User Panel** (`/Users/abk/Documents/web development/dating website`), sharing the exact same Firebase Cloud project, Cloud Firestore database, Firebase Authentication, and Cloudinary media repository.

---

## 💎 Design & UI/UX Standards

- **Background:** Pure white background (`#FFFFFF`) throughout all dashboard views.
- **Sidebar:** Clean white sidebar (`bg-white` with subtle `slate-200` border) and purple active indicators.
- **Typography:** High-contrast slate typography (`#0F172A`, `#334155`, `#64748B`).
- **Accent Theme:** Signature DateMate purple accent color (`#7C3AED`, `#6D28D9`, `#8B5CF6`).
- **Layout:** Fully responsive desktop and laptop grid with modern cards, responsive data tables, and real-time activity indicators.

---

## 🚀 Shared Architecture & Database Sync

The Admin Panel and User Panel operate as two distinct frontends connected to a single unified source of truth:

| Entity / Collection | Shared Firestore Path | Role & Real-Time Sync Behavior |
| :--- | :--- | :--- |
| **Companions** | `companions/{companionId}` | Admin adds, modifies, or disables profiles; immediately synchronized to User Panel discovery in real time via `onSnapshot`. |
| **Partners** | `partners/{partnerId}` | User Panel partner applications stream into Admin Panel for Aadhaar KYC & ₹199 fee review. Approving automatically creates/updates companion. |
| **Users** | `users/{userId}` | Registered clients with ₹99 escrow verification fee status. Admins can audit booking history and suspend accounts. Passwords are never visible. |
| **Locations** | `locations/{locationId}` | Admin toggles availability for any state or city. User Panel instantly displays *"Sorry! Our service is currently not available in your location"* when disabled. |
| **Pricing** | `pricing/datemate_pricing_config` | Centralized booking pricing rules (30m, 1h, 2h, 3h, 4h, 5h tiers, discounts, 10% platform fee, 5% tax). Both panels read the identical configuration. |
| **Bookings** | `bookings/{bookingId}` | Real-time companion booking logs, status transitions, duration tracking, and automated refund entries. |
| **Payments** | `payments/{paymentId}` | Unified Razorpay transaction ledger covering ₹99 user fees, ₹199 partner KYC fees, booking amounts, and refunds. |
| **Notifications** | `notifications/{notifId}` | Live administrative notifications with unread counts and audio/visual alerts. |
| **Admin Logs** | `admin_logs/{logId}` | Immutable audit trail recording every administrative action, timestamp, and target entity. |

---

## 📸 Cloudinary Media Storage Integration

Companion profile photos are managed via Cloudinary's secure REST API:

- **Folder Structure:** `datemate/companions/{companionId}/`
- **Validation:** Minimum 2 photos mandatory before publishing; maximum 5 photos allowed.
- **Features:** Direct computer upload, drag-and-drop, real-time image preview, deletion, primary photo selection, and automated optimization (`quality: auto`, `fetch_format: auto`, max width 1200px).
- **Security:** Cloudinary API Secret is strictly guarded on the server-side (`/api/cloudinary/upload` and `/api/cloudinary/delete`).

---

## 🔐 Admin Authentication & Role Security

- **Restricted Access:** Regular users and partners can never access the Admin Panel.
- **Login Endpoint:** `/login` requiring authorized administrative email (e.g. `admin@datemate.in`, `@datemate.in`).
- **Initial Master Bootstrap Credentials:**
  - **Email:** `admin@datemate.in`
  - **Password:** `DateMateAdmin#2026`
- **Password Recovery:** `/forgot-password` with automated Firebase password reset dispatch.

---

## 🛠️ Quick Start & Local Development

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the shared Firebase credentials and Cloudinary API keys:
```env
# Shared Firebase Credentials
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_app_id:web:your_web_id

# Cloudinary Integration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Shared Razorpay Credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Tvn1jy9LtuAo1p
RAZORPAY_KEY_ID=rzp_live_Tvn1jy9LtuAo1p
RAZORPAY_KEY_SECRET=RXDYSDUkyBNQ3380Mkk5J4Dd

# User Panel URL
NEXT_PUBLIC_USER_PANEL_URL=http://localhost:3000
```

### 2. Start the Development Server
```bash
npm run dev
```
The Admin Panel runs on **`http://localhost:3001`**, while the User Panel runs on **`http://localhost:3000`**.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📋 Synchronization Verification Checklist (8 Tests Passed)

1. **TEST 1: Admin adds companion with 2 photos** → Uploaded to Cloudinary under `datemate/companions/{id}/`, URLs saved in Firestore `companions`, profile appears immediately in User Panel.
2. **TEST 2: Admin edits name or price** → Firestore document updates, User Panel receives update in real-time via `onSnapshot`.
3. **TEST 3: Admin disables a city** → Location marked unavailable in Firestore, User Panel immediately displays *"Sorry! Our service is currently not available in your location"*.
4. **TEST 4: New partner registers in User Panel** → Application streams into `/dashboard/partners` with Aadhaar KYC and ₹199 fee indicator.
5. **TEST 5: Admin approves partner** → Partner application marked approved, companion profile created and published to User Panel.
6. **TEST 6: Admin updates booking pricing** → Rates updated in `pricing/datemate_pricing_config`, User Panel booking modal reads new rates.
7. **TEST 7: Admin disables a companion** → `isActive` set to `false`, profile disappears from User Panel discovery without breaking existing bookings.
8. **TEST 8: Unauthorized user access** → Restricted route guard and non-admin email blocking deny access to public users.

