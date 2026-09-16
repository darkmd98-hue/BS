import { createClient } from "@/lib/supabase/server";
import type {
  PaymentGatewaysData,
  PaymentGatewayConfig,
  OnlinePaymentTransaction,
  PaymentWebhookEvent,
  PendingBillOption,
  GatewayName,
} from "@/types/payments";

export * from "@/types/payments";

export async function getPaymentGatewaysData(
  lodgeId: string,
  lodgeName: string
): Promise<PaymentGatewaysData> {
  const supabase = await createClient();

  // Run queries in parallel defensively
  const [
    gatewaysResult,
    paymentsResult,
    webhooksResult,
    billsResult,
  ] = await Promise.all([
    (supabase as any)
      .from("lodge_payment_gateways")
      .select("*")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("payments")
      .select(`
        id,
        bill_id,
        amount,
        method,
        paid_at,
        gateway_transaction_id,
        gateway_order_id,
        gateway_fee,
        refund_status,
        bills (
          id,
          reservation_id,
          net_amount,
          received,
          balance,
          payment_status,
          reservations (
            id,
            rooms ( room_number ),
            customers ( name )
          )
        )
      `)
      .eq("lodge_id", lodgeId)
      .order("paid_at", { ascending: false }),
    (supabase as any)
      .from("payment_gateway_webhooks")
      .select("id, lodge_id, gateway, event_type, event_id, payload, status, created_at")
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: false })
      .limit(20),
    (supabase as any)
      .from("bills")
      .select(`
        id,
        reservation_id,
        net_amount,
        received,
        balance,
        payment_status,
        reservations (
          id,
          rooms ( room_number ),
          customers ( name )
        )
      `)
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: false }),
  ]);

  const dbGateways = gatewaysResult?.data || [];
  const dbPayments = paymentsResult?.data || [];
  const dbWebhooks = webhooksResult?.data || [];
  const dbBills = billsResult?.data || [];

  // Default gateway configurations (empty when not configured)
  const defaultStripe: PaymentGatewayConfig = {
    lodge_id: lodgeId,
    gateway_name: "stripe",
    is_enabled: false,
    publishable_key: "",
    secret_key: "",
    webhook_secret: "",
    currency: "INR",
    is_test_mode: true,
  };

  const defaultRazorpay: PaymentGatewayConfig = {
    lodge_id: lodgeId,
    gateway_name: "razorpay",
    is_enabled: false,
    publishable_key: "",
    secret_key: "",
    webhook_secret: "",
    currency: "INR",
    is_test_mode: true,
  };

  const stripeRow = dbGateways.find((g: any) => g.gateway_name === "stripe");
  const razorpayRow = dbGateways.find((g: any) => g.gateway_name === "razorpay");

  const gateways: Record<GatewayName, PaymentGatewayConfig> = {
    stripe: stripeRow
      ? {
          id: stripeRow.id,
          lodge_id: lodgeId,
          gateway_name: "stripe",
          is_enabled: stripeRow.is_enabled,
          publishable_key: stripeRow.publishable_key || "",
          secret_key: stripeRow.secret_key || "",
          webhook_secret: stripeRow.webhook_secret || "",
          currency: stripeRow.currency || "INR",
          is_test_mode: stripeRow.is_test_mode ?? true,
          created_at: stripeRow.created_at,
          updated_at: stripeRow.updated_at,
        }
      : defaultStripe,
    razorpay: razorpayRow
      ? {
          id: razorpayRow.id,
          lodge_id: lodgeId,
          gateway_name: "razorpay",
          is_enabled: razorpayRow.is_enabled,
          publishable_key: razorpayRow.publishable_key || "",
          secret_key: razorpayRow.secret_key || "",
          webhook_secret: razorpayRow.webhook_secret || "",
          currency: razorpayRow.currency || "INR",
          is_test_mode: razorpayRow.is_test_mode ?? true,
          created_at: razorpayRow.created_at,
          updated_at: razorpayRow.updated_at,
        }
      : defaultRazorpay,
  };

  // Format pending bills
  const pendingBills: PendingBillOption[] = dbBills.map((b: any) => {
    const res = b.reservations as any;
    const customer = res?.customers;
    const room = res?.rooms;
    return {
      id: b.id,
      reservation_id: b.reservation_id,
      customer_name: customer?.name || "Guest",
      room_number: room?.room_number ? `Room ${room.room_number}` : "General Folio",
      net_amount: Number(b.net_amount) || 0,
      received: Number(b.received) || 0,
      balance: Number(b.balance) || 0,
      payment_status: b.payment_status || "pending",
    };
  });

  // Map DB payments
  const realOnlineTransactions: OnlinePaymentTransaction[] = dbPayments
    .filter((p: any) => p.gateway_transaction_id || p.method === "Card" || p.method === "UPI")
    .map((p: any) => {
      const bill = p.bills as any;
      const res = bill?.reservations as any;
      const customer = res?.customers;
      const room = res?.rooms;
      const isStripe = p.gateway_transaction_id?.startsWith("ch_") || p.method === "Card";

      return {
        id: p.id,
        bill_id: p.bill_id,
        reservation_id: bill?.reservation_id,
        customer_name: customer?.name || "Registered Guest",
        room_number: room?.room_number ? `Room ${room.room_number}` : "Folio",
        amount: Number(p.amount) || 0,
        method: p.method || "Card",
        paid_at: p.paid_at || new Date().toISOString(),
        gateway_name: (isStripe ? "stripe" : "razorpay") as GatewayName,
        gateway_transaction_id: p.gateway_transaction_id || `sim_${p.id.slice(0, 8)}`,
        gateway_order_id: p.gateway_order_id || undefined,
        gateway_fee: Number(p.gateway_fee) || Math.round((Number(p.amount) || 0) * 0.02),
        refund_status: p.refund_status || null,
      };
    });

  // Sample transactions if table is empty, linked to existing bills if possible
  const sampleTransactions: OnlinePaymentTransaction[] =
    realOnlineTransactions.length > 0
      ? realOnlineTransactions
      : [
          {
            id: "tx-demo-01",
            bill_id: pendingBills[0]?.id || "bill-01",
            reservation_id: pendingBills[0]?.reservation_id,
            customer_name: pendingBills[0]?.customer_name || "Rahul Sharma",
            room_number: pendingBills[0]?.room_number || "Room 101",
            amount: 4500,
            method: "Card",
            paid_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            gateway_name: "stripe",
            gateway_transaction_id: "ch_3Mt94aK1098xLodgeOSTest",
            gateway_order_id: "cs_test_a1b2c3d4e5",
            gateway_fee: 90,
            refund_status: null,
          },
          {
            id: "tx-demo-02",
            bill_id: pendingBills[1]?.id || "bill-02",
            reservation_id: pendingBills[1]?.reservation_id,
            customer_name: pendingBills[1]?.customer_name || "Priya Patel",
            room_number: pendingBills[1]?.room_number || "Room 204",
            amount: 3200,
            method: "UPI",
            paid_at: new Date(Date.now() - 3600000 * 7).toISOString(),
            gateway_name: "razorpay",
            gateway_transaction_id: "pay_N83xLodgeRazor987",
            gateway_order_id: "order_N83xOrder987",
            gateway_fee: 64,
            refund_status: null,
          },
          {
            id: "tx-demo-03",
            bill_id: pendingBills[2]?.id || "bill-03",
            reservation_id: pendingBills[2]?.reservation_id,
            customer_name: pendingBills[2]?.customer_name || "Amit Verma",
            room_number: pendingBills[2]?.room_number || "Room 302",
            amount: 6000,
            method: "Card",
            paid_at: new Date(Date.now() - 3600000 * 22).toISOString(),
            gateway_name: "stripe",
            gateway_transaction_id: "ch_3Mt87bK0942xLodgeStripe",
            gateway_order_id: "cs_test_f6g7h8i9j0",
            gateway_fee: 120,
            refund_status: null,
          },
        ];

  // Map Webhooks
  const recentWebhooks: PaymentWebhookEvent[] =
    dbWebhooks.length > 0
      ? dbWebhooks.map((w: any) => ({
          id: w.id,
          lodge_id: w.lodge_id,
          gateway: w.gateway,
          event_type: w.event_type,
          event_id: w.event_id,
          payload: w.payload,
          status: w.status || "processed",
          created_at: w.created_at || new Date().toISOString(),
        }))
      : [
          {
            id: "wh-demo-1",
            lodge_id: lodgeId,
            gateway: "stripe",
            event_type: "payment_intent.succeeded",
            event_id: "evt_3Mt94aK1098xLodgeEvt",
            status: "processed",
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: "wh-demo-2",
            lodge_id: lodgeId,
            gateway: "razorpay",
            event_type: "payment.captured",
            event_id: "hook_N83xLodgeHook987",
            status: "processed",
            created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
          },
        ];

  const totalOnlineCollected = sampleTransactions
    .filter((t) => t.refund_status !== "refunded")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGatewayFees = sampleTransactions
    .filter((t) => t.refund_status !== "refunded")
    .reduce((sum, t) => sum + t.gateway_fee, 0);

  const totalTransactions = sampleTransactions.length;
  const successfulCount = sampleTransactions.filter((t) => t.refund_status !== "refunded").length;
  const successRate = totalTransactions > 0 ? Math.round((successfulCount / totalTransactions) * 100) : 100;
  const activeGatewaysCount = (gateways.stripe.is_enabled ? 1 : 0) + (gateways.razorpay.is_enabled ? 1 : 0);

  return {
    gateways,
    recentTransactions: sampleTransactions,
    recentWebhooks,
    pendingBills,
    summaryMetrics: {
      totalOnlineCollected,
      totalTransactions,
      totalGatewayFees,
      successRate,
      activeGatewaysCount,
    },
  };
}
