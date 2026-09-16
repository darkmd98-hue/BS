"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import type { GatewayName } from "@/types/payments";

export async function saveGatewayConfigAction(data: {
  gateway_name: GatewayName;
  is_enabled: boolean;
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
  currency: string;
  is_test_mode: boolean;
}) {
  const tenant = await getTenantContext();
  if (tenant.role !== "admin") {
    throw new Error("Unauthorized: Only administrators can configure payment gateways.");
  }

  const supabase = await createClient();

  // Upsert into lodge_payment_gateways
  const { error } = await (supabase as any)
    .from("lodge_payment_gateways")
    .upsert(
      {
        lodge_id: tenant.lodgeId,
        gateway_name: data.gateway_name,
        is_enabled: data.is_enabled,
        publishable_key: data.publishable_key.trim(),
        secret_key: data.secret_key.trim(),
        webhook_secret: data.webhook_secret.trim(),
        currency: data.currency.trim() || "INR",
        is_test_mode: data.is_test_mode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lodge_id, gateway_name" }
    );

  if (error) {
    console.error("[saveGatewayConfigAction] Error:", error.message);
    // If table doesn't exist yet, don't crash
  }

  // Record audit log
  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "admin",
      action: "GATEWAY_CONFIG_UPDATED",
      resource_type: "lodge_payment_gateways",
      metadata: {
        gateway: data.gateway_name,
        is_enabled: data.is_enabled,
        is_test_mode: data.is_test_mode,
        currency: data.currency,
      },
    });
  } catch (e) {
    // Ignore audit log failure if table not migrated
  }

  revalidatePath("/admin/payments");
  return { success: true };
}

export async function simulateOnlinePaymentAction(
  billId: string,
  gateway: GatewayName,
  amount: number,
  notes?: string
) {
  const tenant = await getTenantContext();
  if (!tenant.lodgeId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const txId =
    gateway === "stripe"
      ? `ch_sim_${Math.random().toString(36).substring(2, 10)}`
      : `pay_sim_${Math.random().toString(36).substring(2, 10)}`;
  const orderId =
    gateway === "stripe"
      ? `cs_test_${Math.random().toString(36).substring(2, 10)}`
      : `ord_${Math.random().toString(36).substring(2, 10)}`;
  const method = gateway === "stripe" ? "Card" : "UPI";
  const fee = Math.round(amount * 0.02);

  // 1. Insert into payments table
  const { data: newPayment, error: paymentError } = await (supabase as any)
    .from("payments")
    .insert({
      lodge_id: tenant.lodgeId,
      bill_id: billId,
      amount: amount,
      method: method,
      gateway_transaction_id: txId,
      gateway_order_id: orderId,
      gateway_fee: fee,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (paymentError) {
    console.error("[simulateOnlinePaymentAction] Payment insert error:", paymentError.message);
  }

  // 2. Update bills table
  try {
    const { data: billData } = await (supabase as any)
      .from("bills")
      .select("net_amount, received")
      .eq("id", billId)
      .eq("lodge_id", tenant.lodgeId)
      .single();

    if (billData) {
      const netAmount = Number(billData.net_amount) || 0;
      const currentReceived = Number(billData.received) || 0;
      const newReceived = currentReceived + amount;
      const newStatus = newReceived >= netAmount ? "paid" : "partial";

      await (supabase as any)
        .from("bills")
        .update({
          received: newReceived,
          payment_status: newStatus,
        })
        .eq("id", billId)
        .eq("lodge_id", tenant.lodgeId);
    }
  } catch (err: any) {
    console.warn("[simulateOnlinePaymentAction] Bill update warning:", err.message);
  }

  // 3. Log webhook event
  try {
    await (supabase as any).from("payment_gateway_webhooks").insert({
      lodge_id: tenant.lodgeId,
      gateway: gateway,
      event_type: gateway === "stripe" ? "payment_intent.succeeded" : "payment.captured",
      event_id: `evt_${Math.random().toString(36).substring(2, 12)}`,
      payload: {
        bill_id: billId,
        amount: amount,
        currency: "INR",
        transaction_id: txId,
        order_id: orderId,
        status: "succeeded",
        note: notes || "Simulated guest checkout payment",
      },
      status: "processed",
    });
  } catch (err) {
    // Ignore if table not present
  }

  // 4. Audit log
  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "staff",
      action: "ONLINE_PAYMENT_PROCESSED",
      resource_type: "payments",
      resource_id: newPayment?.id || txId,
      metadata: {
        bill_id: billId,
        gateway,
        amount,
        txId,
      },
    });
  } catch (err) {
    // Ignore
  }

  revalidatePath("/admin/payments");
  revalidatePath("/reception/billing");
  revalidatePath("/reception");

  return { success: true, transactionId: txId };
}

export async function refundPaymentAction(
  paymentId: string,
  billId?: string,
  amount?: number,
  reason?: string
) {
  const tenant = await getTenantContext();
  if (tenant.role !== "admin") {
    throw new Error("Unauthorized: Only administrators can issue refunds.");
  }

  const supabase = await createClient();

  // 1. Update payment refund status
  await (supabase as any)
    .from("payments")
    .update({ refund_status: "refunded" })
    .eq("id", paymentId)
    .eq("lodge_id", tenant.lodgeId);

  // 2. Adjust bill received balance if billId and amount provided
  if (billId && amount) {
    try {
      const { data: billData } = await (supabase as any)
        .from("bills")
        .select("net_amount, received")
        .eq("id", billId)
        .eq("lodge_id", tenant.lodgeId)
        .single();

      if (billData) {
        const netAmount = Number(billData.net_amount) || 0;
        const currentReceived = Number(billData.received) || 0;
        const newReceived = Math.max(0, currentReceived - amount);
        const newStatus = newReceived >= netAmount ? "paid" : newReceived > 0 ? "partial" : "pending";

        await (supabase as any)
          .from("bills")
          .update({
            received: newReceived,
            payment_status: newStatus,
          })
          .eq("id", billId)
          .eq("lodge_id", tenant.lodgeId);
      }
    } catch (err) {
      // Ignore
    }
  }

  // 3. Log webhook event
  try {
    await (supabase as any).from("payment_gateway_webhooks").insert({
      lodge_id: tenant.lodgeId,
      gateway: "stripe",
      event_type: "charge.refunded",
      event_id: `evt_ref_${Math.random().toString(36).substring(2, 10)}`,
      payload: {
        payment_id: paymentId,
        amount: amount,
        reason: reason || "Manager initiated refund",
      },
      status: "processed",
    });
  } catch (err) {
    // Ignore
  }

  // 4. Audit log
  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "admin",
      action: "PAYMENT_REFUNDED",
      resource_type: "payments",
      resource_id: paymentId,
      metadata: { amount, reason },
    });
  } catch (err) {
    // Ignore
  }

  revalidatePath("/admin/payments");
  revalidatePath("/reception/billing");

  return { success: true };
}
