"use client";

import { useState } from "react";
import type {
  PaymentGatewaysData,
  PaymentGatewayConfig,
  GatewayName,
  OnlinePaymentTransaction,
} from "@/types/payments";
import {
  saveGatewayConfigAction,
  simulateOnlinePaymentAction,
  refundPaymentAction,
} from "@/app/actions/payments-gateway";

interface Props {
  initialData: PaymentGatewaysData;
  lodgeName: string;
  subdomain: string;
}

const fmt = (n: number, currency: string = "INR") => {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹";
  return `${symbol}${Math.round(n).toLocaleString("en-IN")}`;
};

export function PaymentGatewayClient({ initialData, lodgeName, subdomain }: Props) {
  const [data, setData] = useState<PaymentGatewaysData>(initialData);
  const [activeTab, setActiveTab] = useState<"gateways" | "transactions" | "simulator" | "webhooks">("gateways");

  // Gateway Config Forms
  const [stripeConfig, setStripeConfig] = useState<PaymentGatewayConfig>(data.gateways.stripe);
  const [razorpayConfig, setRazorpayConfig] = useState<PaymentGatewayConfig>(data.gateways.razorpay);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);

  // Saving states
  const [savingGateway, setSavingGateway] = useState<GatewayName | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Simulator state
  const [simBillId, setSimBillId] = useState<string>(data.pendingBills[0]?.id || "");
  const [simGateway, setSimGateway] = useState<GatewayName>("stripe");
  const [simAmount, setSimAmount] = useState<number>(data.pendingBills[0]?.balance || 2500);
  const [simLoading, setSimLoading] = useState(false);
  const [simFeedback, setSimFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Copy state
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Refund state
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const webhookEndpoint = `https://${subdomain}.lodgeos.app/api/webhooks/payments`;

  const copyWebhookUrl = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(webhookEndpoint);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleSaveGateway = async (gatewayName: GatewayName) => {
    setSavingGateway(gatewayName);
    setSaveSuccessMessage(null);

    const config = gatewayName === "stripe" ? stripeConfig : razorpayConfig;
    try {
      await saveGatewayConfigAction(config);
      setData((prev) => ({
        ...prev,
        gateways: {
          ...prev.gateways,
          [gatewayName]: config,
        },
      }));
      setSaveSuccessMessage(`${gatewayName === "stripe" ? "Stripe" : "Razorpay"} configuration saved successfully.`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to save ${gatewayName} configuration: ` + err.message);
    } finally {
      setSavingGateway(null);
    }
  };

  const handleSelectSimBill = (billId: string) => {
    setSimBillId(billId);
    const bill = data.pendingBills.find((b) => b.id === billId);
    if (bill && bill.balance > 0) {
      setSimAmount(bill.balance);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simBillId) {
      setSimFeedback({ type: "error", message: "Please select a pending bill to simulate payment." });
      return;
    }
    if (simAmount <= 0) {
      setSimFeedback({ type: "error", message: "Payment amount must be greater than zero." });
      return;
    }

    setSimLoading(true);
    setSimFeedback(null);

    try {
      const result = await simulateOnlinePaymentAction(simBillId, simGateway, simAmount);
      const bill = data.pendingBills.find((b) => b.id === simBillId);

      const newTx: OnlinePaymentTransaction = {
        id: `tx-sim-${Date.now().toString().slice(-6)}`,
        bill_id: simBillId,
        reservation_id: bill?.reservation_id,
        customer_name: bill?.customer_name || "Guest",
        room_number: bill?.room_number || "Folio",
        amount: simAmount,
        method: simGateway === "stripe" ? "Card" : "UPI",
        paid_at: new Date().toISOString(),
        gateway_name: simGateway,
        gateway_transaction_id: result.transactionId,
        gateway_order_id: simGateway === "stripe" ? "cs_test_live" : "order_live",
        gateway_fee: Math.round(simAmount * 0.02),
        refund_status: null,
      };

      setData((prev) => {
        const updatedTransactions = [newTx, ...prev.recentTransactions];
        const updatedBills = prev.pendingBills
          .map((b) => {
            if (b.id === simBillId) {
              const newReceived = b.received + simAmount;
              const newBalance = Math.max(0, b.net_amount - newReceived);
              return {
                ...b,
                received: newReceived,
                balance: newBalance,
                payment_status: newBalance === 0 ? "paid" : "partial",
              };
            }
            return b;
          })
          .filter((b) => b.balance > 0);

        return {
          ...prev,
          recentTransactions: updatedTransactions,
          pendingBills: updatedBills,
          summaryMetrics: {
            ...prev.summaryMetrics,
            totalOnlineCollected: prev.summaryMetrics.totalOnlineCollected + simAmount,
            totalTransactions: prev.summaryMetrics.totalTransactions + 1,
            totalGatewayFees: prev.summaryMetrics.totalGatewayFees + newTx.gateway_fee,
          },
        };
      });

      setSimFeedback({
        type: "success",
        message: `Payment of ${fmt(simAmount)} processed via ${
          simGateway === "stripe" ? "Stripe" : "Razorpay"
        } (TxID: ${result.transactionId}). Folio updated!`,
      });

      // Update next bill selection
      if (data.pendingBills.length > 0) {
        setSimBillId(data.pendingBills[0].id);
        setSimAmount(data.pendingBills[0].balance);
      }
    } catch (err: any) {
      setSimFeedback({ type: "error", message: err.message || "Payment simulation failed." });
    } finally {
      setSimLoading(false);
    }
  };

  const handleRefund = async (tx: OnlinePaymentTransaction) => {
    if (!confirm(`Are you sure you want to refund ${fmt(tx.amount)} for ${tx.customer_name}?`)) {
      return;
    }

    setRefundingId(tx.id);
    try {
      await refundPaymentAction(tx.id, tx.bill_id, tx.amount, "Manager initiated refund");
      setData((prev) => ({
        ...prev,
        recentTransactions: prev.recentTransactions.map((t) =>
          t.id === tx.id ? { ...t, refund_status: "refunded" } : t
        ),
      }));
      alert(`Refund of ${fmt(tx.amount)} processed successfully.`);
    } catch (err: any) {
      alert("Refund failed: " + err.message);
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Gateways &amp; Folio</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              v2 Enterprise
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Configure Stripe and Razorpay merchant processing for <span className="font-semibold text-gray-800">{lodgeName}</span>, simulate guest checkout, and inspect webhooks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            PCI-DSS Scaffold
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {data.summaryMetrics.activeGatewaysCount} Active Providers
          </span>
          <button
            onClick={() => setActiveTab("simulator")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Test Simulator</span>
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <span>✓</span>
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Online Folio Collected
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {fmt(data.summaryMetrics.totalOnlineCollected)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            ↑ Direct card &amp; UPI settlements
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Total Online Transactions
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data.summaryMetrics.totalTransactions}
          </div>
          <div className="text-xs text-gray-500 mt-1">Settled guest checkouts</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Processing Fees (Est.)
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {fmt(data.summaryMetrics.totalGatewayFees)}
          </div>
          <div className="text-xs text-gray-500 mt-1">~2.0% gateway interchange</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Payment Success Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {data.summaryMetrics.successRate}%
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">High capture reliability</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("gateways")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "gateways"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          💳 Gateway Configurations
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "simulator"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚡ Live Checkout Simulator
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "transactions"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Online Folio Ledger ({data.recentTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "webhooks"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📡 Inbound Webhooks ({data.recentWebhooks.length})
        </button>
      </div>

      {/* TAB 1: GATEWAYS CONFIGURATION */}
      {activeTab === "gateways" && (
        <div className="space-y-6">
          {/* Webhook Endpoint Info Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                LodgeOS Universal Webhook Endpoint
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Register this URL in your Stripe Dashboard &amp; Razorpay Webhooks tab to automate payment updates.
              </p>
              <div className="font-mono text-xs bg-slate-800 px-3 py-1.5 rounded-md mt-2 text-emerald-400 select-all border border-slate-700 inline-block">
                {webhookEndpoint}
              </div>
            </div>
            <button
              onClick={copyWebhookUrl}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold self-start md:self-center transition-colors shrink-0"
            >
              {copiedUrl ? "✓ Copied" : "Copy Endpoint"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stripe Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      S
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Stripe</h2>
                      <p className="text-xs text-gray-500">Credit/Debit Cards, Apple Pay, Google Pay</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stripeConfig.is_enabled}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, is_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Publishable Key (pk_test / pk_live)</label>
                    <input
                      type="text"
                      value={stripeConfig.publishable_key}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, publishable_key: e.target.value })
                      }
                      placeholder="pk_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-gray-700">Secret Key (sk_test / sk_live)</label>
                      <button
                        type="button"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        {showStripeSecret ? "Hide" : "Reveal"}
                      </button>
                    </div>
                    <input
                      type={showStripeSecret ? "text" : "password"}
                      value={stripeConfig.secret_key}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, secret_key: e.target.value })
                      }
                      placeholder="sk_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Webhook Signing Secret (whsec_...)</label>
                    <input
                      type="text"
                      value={stripeConfig.webhook_secret}
                      onChange={(e) =>
                        setStripeConfig({ ...stripeConfig, webhook_secret: e.target.value })
                      }
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Settlement Currency</label>
                      <select
                        value={stripeConfig.currency}
                        onChange={(e) =>
                          setStripeConfig({ ...stripeConfig, currency: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Sandbox Environment</label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stripeConfig.is_test_mode}
                          onChange={(e) =>
                            setStripeConfig({ ...stripeConfig, is_test_mode: e.target.checked })
                          }
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-gray-700 font-medium">Test Mode Enabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveGateway("stripe")}
                  disabled={savingGateway === "stripe"}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingGateway === "stripe" ? "Saving Stripe..." : "Save Stripe Settings"}
                </button>
              </div>
            </div>

            {/* Razorpay Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      R
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Razorpay</h2>
                      <p className="text-xs text-gray-500">UPI, Netbanking, QR Code, RuPay &amp; Cards</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={razorpayConfig.is_enabled}
                      onChange={(e) =>
                        setRazorpayConfig({ ...razorpayConfig, is_enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Key ID (rzp_test / rzp_live)</label>
                    <input
                      type="text"
                      value={razorpayConfig.publishable_key}
                      onChange={(e) =>
                        setRazorpayConfig({ ...razorpayConfig, publishable_key: e.target.value })
                      }
                      placeholder="rzp_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-gray-700">Key Secret</label>
                      <button
                        type="button"
                        onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        {showRazorpaySecret ? "Hide" : "Reveal"}
                      </button>
                    </div>
                    <input
                      type={showRazorpaySecret ? "text" : "password"}
                      value={razorpayConfig.secret_key}
                      onChange={(e) =>
                        setRazorpayConfig({ ...razorpayConfig, secret_key: e.target.value })
                      }
                      placeholder="rzp_secret_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Webhook Secret (Optional)</label>
                    <input
                      type="text"
                      value={razorpayConfig.webhook_secret}
                      onChange={(e) =>
                        setRazorpayConfig({ ...razorpayConfig, webhook_secret: e.target.value })
                      }
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Settlement Currency</label>
                      <select
                        value={razorpayConfig.currency}
                        onChange={(e) =>
                          setRazorpayConfig({ ...razorpayConfig, currency: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                      >
                        <option value="INR">INR (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Sandbox Environment</label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={razorpayConfig.is_test_mode}
                          onChange={(e) =>
                            setRazorpayConfig({ ...razorpayConfig, is_test_mode: e.target.checked })
                          }
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="text-gray-700 font-medium">Test Mode Enabled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveGateway("razorpay")}
                  disabled={savingGateway === "razorpay"}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  {savingGateway === "razorpay" ? "Saving Razorpay..." : "Save Razorpay Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Virtual POS &amp; Checkout Simulator</h2>
              <p className="text-xs text-gray-500">
                Simulate an immediate guest online checkout transaction via Stripe or Razorpay to test folio reconciliation.
              </p>
            </div>
          </div>

          {simFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs mb-5 font-medium flex items-center gap-2 ${
                simFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <span>{simFeedback.type === "success" ? "✓" : "⚠"}</span>
              <span>{simFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleRunSimulation} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Select Pending Reservation Folio</label>
              <select
                value={simBillId}
                onChange={(e) => handleSelectSimBill(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {data.pendingBills.length === 0 ? (
                  <option value="">No pending bills found (all folios settled)</option>
                ) : (
                  data.pendingBills.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.room_number} — {b.customer_name} (Outstanding: {fmt(b.balance)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Payment Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimGateway("stripe")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      simGateway === "stripe"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>💳</span> Stripe (Card)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimGateway("razorpay")}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      simGateway === "razorpay"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>📱</span> Razorpay (UPI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Payment Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Test Credentials Sandbox Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
              <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Simulated Sandbox Payload
              </div>
              {simGateway === "stripe" ? (
                <div className="text-[11px] font-mono text-slate-600">
                  Card: 4242 •••• •••• 4242 | Exp: 12/28 | CVC: 123 | 3D-Secure: Passed
                </div>
              ) : (
                <div className="text-[11px] font-mono text-slate-600">
                  VPA: guest@okhdfcbank | Gateway Auth: Immediate capture | Method: UPI Auto-Credit
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={simLoading || data.pendingBills.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                {simLoading ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <span>⚡ Process Instant {fmt(simAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS LEDGER */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Online Gateway Settlements</h2>
            <span className="text-xs text-gray-500 font-medium">{data.recentTransactions.length} recorded payments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tx ID / Order</th>
                  <th className="px-5 py-3.5">Guest &amp; Room</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Interchange Fee</th>
                  <th className="px-5 py-3.5">Settled At</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-gray-800 text-[11px]">
                        {tx.gateway_transaction_id || tx.id}
                      </div>
                      {tx.gateway_order_id && (
                        <div className="text-[10px] font-mono text-gray-400">{tx.gateway_order_id}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{tx.customer_name}</div>
                      <div className="text-gray-400 text-[11px]">{tx.room_number}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.gateway_name === "stripe"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.gateway_name === "stripe" ? "Stripe" : "Razorpay"} • {tx.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700">{fmt(tx.amount)}</td>
                    <td className="px-5 py-4 text-gray-500 font-mono text-[11px]">{fmt(tx.gateway_fee)}</td>
                    <td className="px-5 py-4 text-gray-400 text-[11px]">
                      {new Date(tx.paid_at).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      {tx.refund_status === "refunded" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Refunded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Captured
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {tx.refund_status !== "refunded" && (
                        <button
                          type="button"
                          onClick={() => handleRefund(tx)}
                          disabled={refundingId === tx.id}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {refundingId === tx.id ? "Refunding..." : "Refund"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS LOG */}
      {activeTab === "webhooks" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Inbound Webhook Event Stream</h2>
            <span className="text-xs text-gray-500 font-medium">Realtime async delivery</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Event ID</th>
                  <th className="px-5 py-3.5">Gateway</th>
                  <th className="px-5 py-3.5">Event Type</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentWebhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-gray-800">{wh.event_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-700 capitalize">{wh.gateway}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-blue-600 font-medium text-[11px]">{wh.event_type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                      {new Date(wh.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {wh.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
