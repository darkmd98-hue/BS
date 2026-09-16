"use client";

import { useState } from "react";
import type {
  NotificationsData,
  NotificationTemplate,
  NotificationProviderSetting,
  NotificationChannel,
  NotificationTrigger,
  NotificationProvider,
} from "@/types/notifications";
import { renderTemplate } from "@/types/notifications";
import {
  saveProviderSettingsAction,
  saveNotificationTemplateAction,
  dispatchTestNotificationAction,
} from "@/app/actions/notifications";

interface Props {
  initialData: NotificationsData;
  lodgeName: string;
  subdomain: string;
}

const TRIGGER_LABELS: Record<NotificationTrigger, { label: string; desc: string; icon: string }> = {
  booking_confirmation: {
    label: "Booking Confirmation",
    desc: "Sent immediately when a reservation is confirmed.",
    icon: "📋",
  },
  checkin_reminder: {
    label: "Check-in Reminder & Pass",
    desc: "Sent morning of check-in with digital room pass details.",
    icon: "🔑",
  },
  checkout_invoice: {
    label: "Checkout Folio & Invoice",
    desc: "Sent automatically upon guest checkout with itemized PDF folio.",
    icon: "🧾",
  },
  cleaning_assigned: {
    label: "Turnover Cleaning Alert",
    desc: "Notifies housekeeping staff when a vacated room requires cleaning.",
    icon: "🧹",
  },
  payment_received: {
    label: "Payment Receipt",
    desc: "Instant SMS/WhatsApp confirmation whenever a payment is logged.",
    icon: "💳",
  },
};

export function NotificationsManagerClient({ initialData, lodgeName, subdomain }: Props) {
  const [data, setData] = useState<NotificationsData>(initialData);
  const [activeTab, setActiveTab] = useState<"templates" | "providers" | "dispatcher" | "logs">("templates");

  // Editing Template State
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Provider Credentials State
  const [providers, setProviders] = useState<Record<NotificationProvider, NotificationProviderSetting>>(
    data.settings
  );
  const [savingProvider, setSavingProvider] = useState<NotificationProvider | null>(null);
  const [showTwilioSecret, setShowTwilioSecret] = useState(false);
  const [showEmailSecret, setShowEmailSecret] = useState(false);

  // Dispatcher Test Terminal State
  const [testTrigger, setTestTrigger] = useState<NotificationTrigger>("booking_confirmation");
  const [testChannel, setTestChannel] = useState<NotificationChannel>("email");
  const [testRecipient, setTestRecipient] = useState("guest@example.com");
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<{
    type: "success" | "error";
    message: string;
    msgId?: string;
  } | null>(null);

  // Feedback Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const sampleVars = {
    guest_name: "Rahul Sharma",
    room_number: "Room 101",
    check_in: "2026-09-18",
    check_out: "2026-09-20",
    total_amount: "₹4,500",
    payment_amount: "₹4,500",
    remaining_balance: "₹0",
    bill_id: "B-9842",
    lodge_name: lodgeName,
    portal_link: `https://${subdomain}.lodgeos.app/guest/login`,
  };

  const currentTestTemplate =
    data.templates.find((t) => t.event_trigger === testTrigger && t.channel === testChannel) ||
    data.templates.find((t) => t.event_trigger === testTrigger) ||
    data.templates[0];

  const renderedPreview = currentTestTemplate
    ? renderTemplate(currentTestTemplate.body_template, sampleVars)
    : "";

  const handleSaveProvider = async (providerKey: NotificationProvider) => {
    setSavingProvider(providerKey);
    setBannerMessage(null);

    const setting = providers[providerKey];
    try {
      await saveProviderSettingsAction(setting);
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [providerKey]: setting,
        },
      }));
      setBannerMessage(`${providerKey.toUpperCase()} credentials saved and active.`);
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to save ${providerKey}: ` + err.message);
    } finally {
      setSavingProvider(null);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setSavingTemplate(true);
    try {
      await saveNotificationTemplateAction(editingTemplate);
      setData((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id === editingTemplate.id ? editingTemplate : t
        ),
      }));
      setEditingTemplate(null);
      setBannerMessage("Template updated successfully.");
      setTimeout(() => setBannerMessage(null), 3500);
    } catch (err: any) {
      alert("Failed to save template: " + err.message);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleToggleTemplate = async (template: NotificationTemplate) => {
    const updated = { ...template, is_enabled: !template.is_enabled };
    try {
      await saveNotificationTemplateAction(updated);
      setData((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === template.id ? updated : t)),
      }));
    } catch (err: any) {
      alert("Failed to update template: " + err.message);
    }
  };

  const handleDispatchTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) {
      setDispatchFeedback({ type: "error", message: "Please provide a valid recipient email or phone number." });
      return;
    }

    setDispatchLoading(true);
    setDispatchFeedback(null);

    try {
      const subject =
        currentTestTemplate?.subject &&
        renderTemplate(currentTestTemplate.subject, sampleVars);

      const result = await dispatchTestNotificationAction({
        recipient: testRecipient,
        channel: testChannel,
        event_trigger: testTrigger,
        subject: subject,
        message: renderedPreview,
      });

      // Update local logs state
      const newLog = {
        id: `log-${Date.now()}`,
        lodge_id: "local",
        recipient: testRecipient,
        channel: testChannel,
        event_trigger: testTrigger,
        subject: subject,
        content: renderedPreview,
        status: "delivered" as const,
        external_msg_id: result.messageId,
        created_at: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        logs: [newLog, ...prev.logs],
        summaryMetrics: {
          ...prev.summaryMetrics,
          totalDelivered: prev.summaryMetrics.totalDelivered + 1,
          emailSent: prev.summaryMetrics.emailSent + (testChannel === "email" ? 1 : 0),
          smsSent: prev.summaryMetrics.smsSent + (testChannel !== "email" ? 1 : 0),
        },
      }));

      setDispatchFeedback({
        type: "success",
        message: `Successfully dispatched to ${testRecipient} via ${testChannel.toUpperCase()}!`,
        msgId: result.messageId,
      });
    } catch (err: any) {
      setDispatchFeedback({ type: "error", message: err.message || "Dispatch failed." });
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Automated Notifications</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              v2 Enterprise
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Omnichannel guest &amp; staff communication engine (Twilio SMS/WhatsApp &amp; SendGrid Email) for{" "}
            <span className="font-semibold text-gray-800">{lodgeName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Twilio &amp; SendGrid Active
          </span>
          <button
            onClick={() => setActiveTab("dispatcher")}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>⚡</span>
            <span>Send Test Message</span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <span>✓</span>
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Total Messages Delivered
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.summaryMetrics.totalDelivered}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">↑ 100% gateway SLA</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Delivery Success Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {data.summaryMetrics.deliveryRate}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Zero bounce rate reported</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            Emails Dispatched
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {data.summaryMetrics.emailSent}
          </div>
          <div className="text-xs text-gray-500 mt-1">SendGrid transactional</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1">
            SMS &amp; WhatsApp Alerts
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {data.summaryMetrics.smsSent}
          </div>
          <div className="text-xs text-gray-500 mt-1">Twilio carrier routes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "templates"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📝 Automated Templates ({data.templates.length})
        </button>
        <button
          onClick={() => setActiveTab("providers")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "providers"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚙️ Provider API Keys (Twilio &amp; SendGrid)
        </button>
        <button
          onClick={() => setActiveTab("dispatcher")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "dispatcher"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚡ Live Test Dispatcher
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "logs"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📜 Delivery Audit Trail ({data.logs.length})
        </button>
      </div>

      {/* TAB 1: TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Event-Driven Notification Rules</h2>
              <span className="text-xs text-gray-500 font-medium">Fires automatically on guest actions</span>
            </div>

            <div className="divide-y divide-gray-100">
              {data.templates.map((tpl) => {
                const triggerInfo = TRIGGER_LABELS[tpl.event_trigger] || {
                  label: tpl.event_trigger,
                  desc: "Trigger event",
                  icon: "🔔",
                };

                return (
                  <div
                    key={tpl.id}
                    className="p-4 hover:bg-gray-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0">
                        {triggerInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{tpl.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                              tpl.channel === "email"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : tpl.channel === "sms"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {tpl.channel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{triggerInfo.desc}</p>
                        {tpl.subject && (
                          <div className="text-[11px] text-gray-400 mt-1 font-mono">
                            Subject: {tpl.subject}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tpl.is_enabled}
                          onChange={() => handleToggleTemplate(tpl)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>

                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Customize Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Template Modal */}
          {editingTemplate && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-gray-200 max-w-2xl w-full p-6 shadow-xl animate-scaleIn">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <h3 className="text-base font-bold text-gray-900">
                    Customize Notification Template
                  </h3>
                  <button
                    onClick={() => setEditingTemplate(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {editingTemplate.channel === "email" && (
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Email Subject Line</label>
                      <input
                        type="text"
                        value={editingTemplate.subject || ""}
                        onChange={(e) =>
                          setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                        }
                        placeholder="Subject with {{variables}}..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-medium text-gray-700">Body Template</label>
                      <span className="text-[11px] text-gray-400">Supports mustache variables</span>
                    </div>
                    <textarea
                      rows={6}
                      value={editingTemplate.body_template}
                      onChange={(e) =>
                        setEditingTemplate({ ...editingTemplate, body_template: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Variable Pills */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-gray-500">Available Variables:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "{{guest_name}}",
                        "{{room_number}}",
                        "{{check_in}}",
                        "{{check_out}}",
                        "{{total_amount}}",
                        "{{payment_amount}}",
                        "{{remaining_balance}}",
                        "{{lodge_name}}",
                        "{{portal_link}}",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setEditingTemplate({
                              ...editingTemplate,
                              body_template: editingTemplate.body_template + " " + tag,
                            })
                          }
                          className="px-2 py-0.5 rounded bg-gray-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 text-[10px] font-mono text-gray-600 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      {savingTemplate ? "Saving..." : "Save Template"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROVIDERS */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Twilio Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                    T
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Twilio</h2>
                    <p className="text-xs text-gray-500">Carrier SMS &amp; WhatsApp Business API</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providers.twilio.is_enabled}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        twilio: { ...providers.twilio, is_enabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Twilio Account SID</label>
                  <input
                    type="text"
                    value={providers.twilio.api_key}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        twilio: { ...providers.twilio, api_key: e.target.value },
                      })
                    }
                    placeholder="AC..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-gray-700">Auth Token</label>
                    <button
                      type="button"
                      onClick={() => setShowTwilioSecret(!showTwilioSecret)}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      {showTwilioSecret ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <input
                    type={showTwilioSecret ? "text" : "password"}
                    value={providers.twilio.api_secret}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        twilio: { ...providers.twilio, api_secret: e.target.value },
                      })
                    }
                    placeholder="Twilio Auth Token"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">From Phone Number (E.164)</label>
                  <input
                    type="text"
                    value={providers.twilio.from_phone}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        twilio: { ...providers.twilio, from_phone: e.target.value },
                      })
                    }
                    placeholder="+15553098472"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveProvider("twilio")}
                disabled={savingProvider === "twilio"}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {savingProvider === "twilio" ? "Saving..." : "Save Twilio Settings"}
              </button>
            </div>
          </div>

          {/* SendGrid Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    SG
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">SendGrid / Resend</h2>
                    <p className="text-xs text-gray-500">High-deliverability transactional emails</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providers.sendgrid.is_enabled}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        sendgrid: { ...providers.sendgrid, is_enabled: e.target.checked },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-gray-700">API Key</label>
                    <button
                      type="button"
                      onClick={() => setShowEmailSecret(!showEmailSecret)}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      {showEmailSecret ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <input
                    type={showEmailSecret ? "text" : "password"}
                    value={providers.sendgrid.api_key}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        sendgrid: { ...providers.sendgrid, api_key: e.target.value },
                      })
                    }
                    placeholder="SG.••••••••••••"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">From Sender Email</label>
                  <input
                    type="email"
                    value={providers.sendgrid.from_email}
                    onChange={(e) =>
                      setProviders({
                        ...providers,
                        sendgrid: { ...providers.sendgrid, from_email: e.target.value },
                      })
                    }
                    placeholder="reservations@lodge.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveProvider("sendgrid")}
                disabled={savingProvider === "sendgrid"}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {savingProvider === "sendgrid" ? "Saving..." : "Save SendGrid Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISPATCHER */}
      {activeTab === "dispatcher" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Real-Time Dispatch Test Terminal</h2>
              <p className="text-xs text-gray-500">
                Trigger an automated guest notification immediately to verify carrier routing and template formatting.
              </p>
            </div>
          </div>

          {dispatchFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs mb-5 font-medium flex items-center justify-between ${
                dispatchFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{dispatchFeedback.type === "success" ? "✓" : "⚠"}</span>
                <span>{dispatchFeedback.message}</span>
              </div>
              {dispatchFeedback.msgId && (
                <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                  {dispatchFeedback.msgId}
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleDispatchTest} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Notification Event Trigger</label>
                <select
                  value={testTrigger}
                  onChange={(e) => setTestTrigger(e.target.value as NotificationTrigger)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="booking_confirmation">Booking Confirmation</option>
                  <option value="checkin_reminder">Check-in Reminder</option>
                  <option value="checkout_invoice">Checkout Invoice</option>
                  <option value="cleaning_assigned">Housekeeping Turnover</option>
                  <option value="payment_received">Payment Receipt</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1.5">Delivery Channel</label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="email">Email (SendGrid / SMTP)</option>
                  <option value="sms">SMS (Twilio)</option>
                  <option value="whatsapp">WhatsApp (Twilio)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1.5">Recipient Address / Phone</label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder={testChannel === "email" ? "guest@example.com" : "+91 98765 43210"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* Live Rendered Message Preview Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Rendered Message Output (Live Preview)
                </span>
                <span className="text-[10px] text-blue-600 font-semibold uppercase">
                  Channel: {testChannel}
                </span>
              </div>
              {currentTestTemplate?.subject && testChannel === "email" && (
                <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5 text-xs">
                  Subject: {renderTemplate(currentTestTemplate.subject, sampleVars)}
                </div>
              )}
              <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                {renderedPreview || "No template configured for this trigger."}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={dispatchLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                {dispatchLoading ? "Dispatching..." : "⚡ Dispatch Outbound Message"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Outbound Notification Delivery Trail</h2>
            <span className="text-xs text-gray-500 font-medium">{data.logs.length} logged messages</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Message ID</th>
                  <th className="px-5 py-3.5">Recipient</th>
                  <th className="px-5 py-3.5">Channel</th>
                  <th className="px-5 py-3.5">Event Trigger</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-gray-800">
                      {log.external_msg_id || log.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{log.recipient}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.channel === "email"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : log.channel === "sms"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-[11px]">{log.event_trigger}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {log.status}
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
