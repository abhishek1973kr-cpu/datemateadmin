import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * SECURE BACKEND PAYMENT VERIFIER
 * Validates payments strictly against:
 * 1. Razorpay HMAC-SHA256 signature verification
 * 2. Razorpay Official REST API (/v1/payments/:id) to verify captured status
 * 
 * Never trusts unverified frontend claims.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, orderId, signature } = body;

    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json(
        { verified: false, error: "Valid Razorpay paymentId is required" },
        { status: 400 }
      );
    }

    // Prohibit any demo or fake payment strings
    const lowerId = paymentId.toLowerCase();
    if (lowerId.includes("demo") || lowerId.includes("test_") || lowerId.includes("fake")) {
      return NextResponse.json(
        { verified: false, error: "Demo or fabricated transaction IDs are strictly rejected." },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. If orderId and signature are supplied, verify HMAC
    if (orderId && signature) {
      if (!keySecret) {
        return NextResponse.json(
          { verified: false, error: "Server RAZORPAY_KEY_SECRET is not configured." },
          { status: 500 }
        );
      }

      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (generatedSignature !== signature) {
        return NextResponse.json(
          {
            verified: false,
            error: "Payment signature mismatch: Verification failed. Transaction rejected."
          },
          { status: 400 }
        );
      }
    }

    // 2. Query Razorpay API directly for authoritative payment status
    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json"
          },
          cache: "no-store"
        });

        if (!rzpResponse.ok) {
          const errData = await rzpResponse.json().catch(() => ({}));
          return NextResponse.json(
            {
              verified: false,
              error: errData?.error?.description || "Payment ID not found in live Razorpay gateway."
            },
            { status: rzpResponse.status }
          );
        }

        const rzpData = await rzpResponse.json();

        // Authentic status verification:
        // Razorpay status values: "captured", "authorized", "failed", "refunded"
        const isCaptured = rzpData.status === "captured";

        return NextResponse.json({
          verified: isCaptured,
          status: isCaptured ? "paid" : rzpData.status,
          amount: (rzpData.amount || 0) / 100, // in INR
          currency: rzpData.currency || "INR",
          method: rzpData.method,
          email: rzpData.email,
          contact: rzpData.contact,
          capturedAt: rzpData.created_at ? new Date(rzpData.created_at * 1000).toISOString() : new Date().toISOString(),
          gatewayTransactionId: rzpData.id,
          gatewayOrderId: rzpData.order_id,
          rawStatus: rzpData.status,
          message: isCaptured
            ? "Payment verified authentic and successfully captured."
            : `Payment is currently ${rzpData.status} on Razorpay.`
        });
      } catch (gatewayErr) {
        return NextResponse.json(
          {
            verified: false,
            error: `Failed to reach Razorpay gateway: ${(gatewayErr as Error).message}`
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      {
        verified: false,
        error: "Server payment gateway credentials not configured."
      },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { verified: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
