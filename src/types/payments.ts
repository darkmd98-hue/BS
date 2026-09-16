export type GatewayName = "stripe" | "razorpay";

export interface PaymentGatewayConfig {
  id?: string;
  lodge_id: string;
  gateway_name: GatewayName;
  is_enabled: boolean;
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
  currency: string;
  is_test_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OnlinePaymentTransaction {
  id: string;
  bill_id: string;
  reservation_id?: string;
  customer_name?: string;
  room_number?: string;
  amount: number;
  method: string;
  paid_at: string;
  gateway_name: GatewayName | "card" | "upi" | "other";
  gateway_transaction_id?: string;
  gateway_order_id?: string;
  gateway_fee: number;
  refund_status: "none" | "partial" | "refunded" | null;
}

export interface PaymentWebhookEvent {
  id: string;
  lodge_id: string;
  gateway: string;
  event_type: string;
  event_id: string;
  payload?: any;
  status: "received" | "processed" | "failed";
  created_at: string;
}

export interface PendingBillOption {
  id: string;
  reservation_id: string;
  customer_name: string;
  room_number: string;
  net_amount: number;
  received: number;
  balance: number;
  payment_status: string;
}

export interface PaymentGatewaysData {
  gateways: Record<GatewayName, PaymentGatewayConfig>;
  recentTransactions: OnlinePaymentTransaction[];
  recentWebhooks: PaymentWebhookEvent[];
  pendingBills: PendingBillOption[];
  summaryMetrics: {
    totalOnlineCollected: number;
    totalTransactions: number;
    totalGatewayFees: number;
    successRate: number;
    activeGatewaysCount: number;
  };
}
