import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const url = new URL(request.url);
    const queryLodgeId = url.searchParams.get("lodgeId");
    const headerLodgeId = request.headers.get("x-lodge-id");

    const payload = await request.json().catch(() => ({}));

    // Extract lodge ID from headers, query, or payload metadata
    const lodgeId =
      queryLodgeId ||
      headerLodgeId ||
      payload?.metadata?.lodge_id ||
      payload?.data?.object?.metadata?.lodge_id ||
      payload?.payload?.payment?.entity?.notes?.lodge_id;

    if (!lodgeId) {
      // If no lodge ID is provided, log warning and return 400
      return NextResponse.json(
        { error: "Missing required lodge identifier (header x-lodge-id, query param, or metadata)" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Identify gateway and event details
    let gateway = "unknown";
    let eventType = "unknown";
    let eventId = `evt_${Date.now()}`;
    let billId: string | null = null;
    let amount = 0;
    let transactionId = "";

    // Stripe signature or payload structure
    if (payload.object === "event" || payload.type) {
      gateway = "stripe";
      eventType = payload.type || "stripe.event";
      eventId = payload.id || eventId;
      const obj = payload.data?.object || {};
      billId = obj.metadata?.bill_id || null;
      amount = (Number(obj.amount) || 0) / 100; // Stripe amounts in cents
      transactionId = obj.id || `ch_${eventId}`;
    }
    // Razorpay signature or payload structure
    else if (payload.event || payload.entity === "event") {
      gateway = "razorpay";
      eventType = payload.event || "razorpay.event";
      eventId = payload.id || eventId;
      const paymentEntity = payload.payload?.payment?.entity || {};
      billId = paymentEntity.notes?.bill_id || null;
      amount = (Number(paymentEntity.amount) || 0) / 100; // Razorpay amounts in paise
      transactionId = paymentEntity.id || `pay_${eventId}`;
    } else {
      gateway = request.headers.get("x-gateway") || "custom";
      eventType = payload.event_type || "payment.received";
      billId = payload.bill_id || null;
      amount = Number(payload.amount) || 0;
      transactionId = payload.transaction_id || `tx_${eventId}`;
    }

    // 1. Ingest into payment_gateway_webhooks table
    try {
      await (adminSupabase as any).from("payment_gateway_webhooks").insert({
        lodge_id: lodgeId,
        gateway: gateway,
        event_type: eventType,
        event_id: eventId,
        payload: payload,
        status: "processed",
        created_at: new Date().toISOString(),
      });
    } catch (whErr: any) {
      console.warn("[Webhook] Logging error:", whErr.message);
    }

    // 2. If payment was successful, update payment and folio
    const isSuccessEvent =
      eventType === "payment_intent.succeeded" ||
      eventType === "charge.succeeded" ||
      eventType === "payment.captured" ||
      eventType === "order.paid";

    if (isSuccessEvent && billId && amount > 0) {
      try {
        // Record payment
        await (adminSupabase as any).from("payments").insert({
          lodge_id: lodgeId,
          bill_id: billId,
          amount: amount,
          method: gateway === "stripe" ? "Card" : "UPI",
          gateway_transaction_id: transactionId,
          gateway_fee: Math.round(amount * 0.02),
          paid_at: new Date().toISOString(),
        });

        // Update bill status
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
