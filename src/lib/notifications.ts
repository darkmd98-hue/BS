import { createClient } from "@/lib/supabase/server";
import type {
  NotificationsData,
  NotificationTemplate,
  NotificationLog,
  NotificationProviderSetting,
  NotificationProvider,
} from "@/types/notifications";

export * from "@/types/notifications";

export function renderTemplate(body: string, vars: Record<string, string>): string {
  let rendered = body;
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, value);
  });
  return rendered;
}

export async function getNotificationsData(
  lodgeId: string,
  lodgeName: string
): Promise<NotificationsData> {
  const supabase = await createClient();

  const [settingsResult, templatesResult, logsResult] = await Promise.all([
    (supabase as any)
      .from("lodge_notification_settings")
      .select("*")
      .eq("lodge_id", lodgeId),
    (supabase as any)
      .from("notification_templates")
      .select("*")
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: true }),
    (supabase as any)
      .from("notification_log")
      .select("*")
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const dbSettings = settingsResult?.data || [];
  const dbTemplates = templatesResult?.data || [];
  const dbLogs = logsResult?.data || [];

  // Default provider credentials
  const defaultSettings: Record<NotificationProvider, NotificationProviderSetting> = {
    twilio: {
      lodge_id: lodgeId,
      provider: "twilio",
      is_enabled: true,
      api_key: "AC39a84f092e81d77b8192a01",
      api_secret: "••••••••••••••••••••39a1",
      from_phone: "+1 (555) 309-8472",
      from_email: "",
    },
    sendgrid: {
      lodge_id: lodgeId,
      provider: "sendgrid",
      is_enabled: true,
      api_key: "SG.9842a_demo_secret••••••••••••",
      api_secret: "",
      from_email: `reservations@${lodgeName.toLowerCase().replace(/\s+/g, "")}.com`,
      from_phone: "",
    },
    resend: {
      lodge_id: lodgeId,
      provider: "resend",
      is_enabled: false,
      api_key: "",
      api_secret: "",
      from_email: "",
      from_phone: "",
    },
    postmark: {
      lodge_id: lodgeId,
      provider: "postmark",
      is_enabled: false,
      api_key: "",
      api_secret: "",
      from_email: "",
      from_phone: "",
    },
  };

  dbSettings.forEach((row: any) => {
    const p = row.provider as NotificationProvider;
    if (defaultSettings[p]) {
      defaultSettings[p] = {
        id: row.id,
        lodge_id: lodgeId,
        provider: p,
        is_enabled: row.is_enabled,
        api_key: row.api_key || "",
        api_secret: row.api_secret || "",
        from_email: row.from_email || "",
        from_phone: row.from_phone || "",
        updated_at: row.updated_at,
      };
    }
  });

  // Default automated triggers & templates
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: "tpl-1",
      lodge_id: lodgeId,
      name: "Guest Booking Confirmation (Email)",
      event_trigger: "booking_confirmation",
      channel: "email",
      subject: `Your Stay Confirmation at ${lodgeName} - Room {{room_number}}`,
      body_template: `Dear {{guest_name}},\n\nYour reservation at ${lodgeName} has been confirmed!\n\nRoom: {{room_number}}\nCheck-in: {{check_in}}\nCheck-out: {{check_out}}\nTotal Amount: {{total_amount}}\n\nWe look forward to welcoming you.\n\nWarm regards,\n${lodgeName} Front Desk Team`,
      is_enabled: true,
    },
    {
      id: "tpl-2",
      lodge_id: lodgeId,
      name: "Check-in Reminder (SMS)",
      event_trigger: "checkin_reminder",
      channel: "sms",
      body_template: `Hi {{guest_name}}, we look forward to hosting you at ${lodgeName} today! Check-in starts at 2:00 PM. Access your digital guest pass: {{portal_link}}`,
      is_enabled: true,
    },
    {
      id: "tpl-3",
      lodge_id: lodgeId,
      name: "Checkout Folio & Invoice (Email)",
      event_trigger: "checkout_invoice",
      channel: "email",
      subject: `Thank you for visiting ${lodgeName} - Invoice #{{bill_id}}`,
      body_template: `Dear {{guest_name}},\n\nThank you for choosing ${lodgeName}. Attached is your itemized folio invoice.\n\nTotal Paid: {{total_amount}}\nBalance: ₹0\n\nSafe travels and visit us again!\n\n${lodgeName} Management`,
      is_enabled: true,
    },
    {
      id: "tpl-4",
      lodge_id: lodgeId,
      name: "Staff Turnover Alert (SMS)",
      event_trigger: "cleaning_assigned",
      channel: "sms",
      body_template: `LodgeOS Alert: Room {{room_number}} has checked out and is queued for immediate sanitization and turnover.`,
      is_enabled: true,
    },
    {
      id: "tpl-5",
      lodge_id: lodgeId,
      name: "Instant Payment Receipt (WhatsApp)",
      event_trigger: "payment_received",
      channel: "whatsapp",
      body_template: `Namaste {{guest_name}}! We have received your payment of {{payment_amount}} for Room {{room_number}}. Remaining folio balance: {{remaining_balance}}. Thank you!`,
      is_enabled: true,
    },
  ];

  const templates: NotificationTemplate[] =
    dbTemplates.length > 0 ? dbTemplates : defaultTemplates;

  // Sample delivery logs
  const sampleLogs: NotificationLog[] =
    dbLogs.length > 0
      ? dbLogs
      : [
          {
            id: "log-1",
            lodge_id: lodgeId,
            recipient: "rahul.sharma@example.com",
            channel: "email",
            event_trigger: "booking_confirmation",
            subject: `Stay Confirmation at ${lodgeName}`,
            content: `Dear Rahul Sharma, your booking for Room 101 has been confirmed.`,
            status: "delivered",
            external_msg_id: "msg_sg_9842a819",
            created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
          },
          {
            id: "log-2",
            lodge_id: lodgeId,
            recipient: "+91 98765 43210",
            channel: "sms",
            event_trigger: "checkin_reminder",
            content: `Hi Priya Patel, we look forward to hosting you today at ${lodgeName}!`,
            status: "delivered",
            external_msg_id: "SM39a049182b8",
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
          {
            id: "log-3",
            lodge_id: lodgeId,
            recipient: "+91 98450 11223",
            channel: "whatsapp",
            event_trigger: "payment_received",
            content: `Namaste Amit! Received payment of ₹4,500. Balance: ₹0.`,
            status: "delivered",
            external_msg_id: "wamid.HBgL",
            created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
          },
          {
            id: "log-4",
            lodge_id: lodgeId,
            recipient: "housekeeping@staff.internal",
            channel: "sms",
            event_trigger: "cleaning_assigned",
            content: `Room 204 queued for turnover cleaning.`,
            status: "delivered",
            external_msg_id: "SM884210984",
            created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          },
        ];

  const totalDelivered = sampleLogs.filter((l) => l.status === "delivered").length;
  const deliveryRate =
    sampleLogs.length > 0 ? Math.round((totalDelivered / sampleLogs.length) * 100) : 100;
  const emailSent = sampleLogs.filter((l) => l.channel === "email").length;
  const smsSent = sampleLogs.filter((l) => l.channel === "sms" || l.channel === "whatsapp").length;
  const activeChannelsCount = (defaultSettings.twilio.is_enabled ? 1 : 0) + (defaultSettings.sendgrid.is_enabled ? 1 : 0);

  return {
    templates,
    logs: sampleLogs,
    settings: defaultSettings,
    summaryMetrics: {
      totalDelivered,
      deliveryRate,
      emailSent,
      smsSent,
      activeChannelsCount,
    },
  };
}
