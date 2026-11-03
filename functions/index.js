const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cloudinary = require("cloudinary").v2;

admin.initializeApp();

// Configure Cloudinary server-side
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Assign Super Admin Custom Claim to authorized email
 */
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Only existing admins or initial setup can call this
  if (context.auth && context.auth.token.admin !== true) {
    if (!context.auth.token.email.endsWith("@datemate.in")) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only authorized DateMate staff can assign administrative roles."
      );
    }
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required.");
  }

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, {
    admin: true,
    role: "super_admin"
  });

  return { message: `Success! ${email} has been granted Master Admin privileges.` };
});

/**
 * Generate Secure Signed Upload Signature for Cloudinary
 */
exports.getCloudinaryUploadSignature = functions.https.onCall((data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("unauthenticated", "Admin privilege required.");
  }

  const { companionId } = data;
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `datemate/companions/${companionId || "general"}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  };
});

/**
 * Trigger: On New Partner Application -> Notify Admin Panel
 */
exports.onPartnerApplicationCreated = functions.firestore
  .document("partners/{partnerId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const partnerId = context.params.partnerId;

    const notifId = `notif_ptr_${Date.now()}`;
    await admin.firestore().collection("notifications").doc(notifId).set({
      id: notifId,
      title: "New Partner Application",
      message: `${data.fullLegalName || "New applicant"} submitted an application in ${data.city || "India"} with ₹${data.feeAmount || 199} fee.`,
      type: "partner",
      isRead: false,
      link: "/dashboard/partners",
      createdAt: new Date().toISOString()
    });
  });

/**
 * Trigger: On New Booking -> Notify Admin Panel
 */
exports.onBookingCreated = functions.firestore
  .document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const bookingId = context.params.bookingId;

    const notifId = `notif_bk_${Date.now()}`;
    await admin.firestore().collection("notifications").doc(notifId).set({
      id: notifId,
      title: "New Companion Booking",
      message: `${data.clientName || "Client"} booked ${data.companionName || "Companion"} for ${data.durationHours || 1} hrs in ${data.companionCity || "India"} (₹${data.totalAmount}).`,
      type: "booking",
      isRead: false,
      link: "/dashboard/bookings",
      createdAt: new Date().toISOString()
    });
  });
