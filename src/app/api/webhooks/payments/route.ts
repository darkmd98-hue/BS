import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import crypto from "crypto";

const ALLOWED_ORIGINS = new Set([
  "https://api.stripe.com",
  "https://api.razorpay.com",
]);

function corsHeaders(origin: string | null): HeadersInit {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return { "Access-Control-Allow-Origin": origin };
  }
  return {};
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "LodgeOS Payment Webhook Ingestion Engine",
    supported_gateways: ["stripe", "razorpay"],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature") ||
                      request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    const rawBody = await request.text();
    const isStripe = request.headers.has("stripe-signature");
    const adminSupabase = createAdminClient();

    const url = new URL(request.url);
    const queryLodgeId = url.searchParams.get("lodgeId");
    const headerLodgeId = request.headers.get("x-lodge-id");

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const lodgeIdFromPayload =
      payload?.metadata?.lodge_id ||
      payload?.data?.object?.metadata?.lodge_id ||
      payload?.payload?.payment?.entity?.notes?.lodge_id;

    const lodgeId = queryLodgeId || headerLodgeId || lodgeIdFromPayload;

    if (!lodgeId) {
      return NextResponse.json(
        { error: "Missing required lodge identifier" },
        { status: 400 }
      );
    }

    // Get webhook secret from database
    const { data: gatewayConfig } = await (adminSupabase as any)
      .from("lodge_payment_gateways")
      .select("webhook_secret, lodge_id")
      .eq("lodge_id", lodgeId)
      .eq("gateway_name", isStripe ? "stripe" : "razorpay")
      .single();

    if (!gatewayConfig?.webhook_secret) {
      return NextResponse.json({ error: "Gateway not configured" }, { status: 400 });
    }

    let event: any;
    try {
      if (isStripe) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2024-11-20.acacia" as any,
        });
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          gatewayConfig.webhook_secret
        );
      } else {
        // Razorpay signature verification
        const expectedSignature = crypto
          .createHmac("sha256", gatewayConfig.webhook_secret)
          .update(rawBody)
          .digest("hex");

        if (signature !== expectedSignature) {
          throw new Error("Invalid signature");
        }
        event = JSON.parse(rawBody);
      }
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Identify gateway and event details
    let gateway = "unknown";
    let eventType = "unknown";
    let eventId = `evt_${Date.now()}`;
    let billId: string | null = null;
    let amount = 0;
    let transactionId = "";

    if (event.object === "event" || event.type) {
      gateway = "stripe";
      eventType = event.type || "stripe.event";
      eventId = event.id || eventId;
      const obj = event.data?.object || {};
      billId = obj.metadata?.bill_id || null;
      amount = (Number(obj.amount) || 0) / 100;
      transactionId = obj.id || `ch_${eventId}`;
    } else if (event.event || event.entity === "event") {
      gateway = "razorpay";
      eventType = event.event || "razorpay.event";
      eventId = event.id || eventId;
      const paymentEntity = event.payload?.payment?.entity || {};
      billId = paymentEntity.notes?.bill_id || null;
      amount = (Number(paymentEntity.amount) || 0) / 100;
      transactionId = paymentEntity.id || `pay_${eventId}`;
    } else {
      gateway = request.headers.get("x-gateway") || "custom";
      eventType = event.event_type || "payment.received";
      billId = event.bill_id || null;
      amount = Number(event.amount) || 0;
      transactionId = event.transaction_id || `tx_${eventId}`;
    }

    // Check for duplicate event_id (idempotency)
    const { data: existing } = await (adminSupabase as any)
      .from("payment_gateway_webhooks")
      .select("id")
      .eq("event_id", eventId)
      .eq("lodge_id", lodgeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Ingest into payment_gateway_webhooks table
    try {
      await (adminSupabase as any).from("payment_gateway_webhooks").insert({
        lodge_id: lodgeId,
        gateway: gateway,
        event_type: eventType,
        event_id: eventId,
        payload: event,
        status: "processed",
        created_at: new Date().toISOString(),
      });
    } catch (whErr: any) {
      console.warn("[Webhook] Logging error:", whErr.message);
    }

    // If payment was successful, update payment and folio
    const isSuccessEvent =
      eventType === "payment_intent.succeeded" ||
      eventType === "charge.succeeded" ||
      eventType === "payment.captured" ||
      eventType === "order.paid";

    if (isSuccessEvent && billId && amount > 0) {
      try {
        await (adminSupabase as any).from("payments").insert({
          lodge_id: lodgeId,
          bill_id: billId,
          amount: amount,
          method: gateway === "stripe" ? "Card" : "UPI",
          gateway_transaction_id: transactionId,
          gateway_fee: Math.round(amount * 0.02),
          paid_at: new Date().toISOString(),
        });

        const { data: billData } = await (adminSupabase as any)
          .from("bills")
          .select("net_amount, received")
          .eq("id", billId)
          .single();

        if (billData) {
          const net = Number(billData.net_amount) || 0;
          const currentReceived = Number(billData.received) || 0;
          const newReceived = currentReceived + amount;
          const newStatus = newReceived >= net ? "paid" : "partial";

          await (adminSupabase as any)
            .from("bills")
            .update({
              received: newReceived,
              payment_status: newStatus,
            })
            .eq("id", billId);
        }
      } catch (procErr: any) {
        console.error("[Webhook] Payment folio update failed:", procErr.message);
      }
    }

    return NextResponse.json({
      received: true,
      gateway,
      event_type: eventType,
      status: "processed",
    });
  } catch (error: any) {
    console.error("[Payment Webhook Handler] Crash:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error", message: error.message },
      { status: 500 }
    );
  }
}