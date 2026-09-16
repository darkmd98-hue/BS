export type NotificationChannel = "email" | "sms" | "whatsapp";

export type NotificationTrigger =
  | "booking_confirmation"
  | "checkin_reminder"
  | "checkout_invoice"
  | "cleaning_assigned"
  | "payment_received";

export type NotificationProvider = "twilio" | "sendgrid" | "resend" | "postmark";

export interface NotificationTemplate {
  id: string;
  lodge_id: string;
  name: string;
  event_trigger: NotificationTrigger;
  channel: NotificationChannel;
  subject?: string;
  body_template: string;
  is_enabled: boolean;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  lodge_id: string;
  recipient: string;
  channel: NotificationChannel;
  event_trigger: NotificationTrigger;
  subject?: string;
  content: string;
  status: "delivered" | "failed" | "queued";
  external_msg_id?: string;
  error_message?: string;
  created_at: string;
}

export interface NotificationProviderSetting {
  id?: string;
  lodge_id: string;
  provider: NotificationProvider;
  is_enabled: boolean;
  api_key: string;
  api_secret?: string;
  from_email?: string;
  from_phone?: string;
  updated_at?: string;
}

export interface NotificationsData {
  templates: NotificationTemplate[];
  logs: NotificationLog[];
  settings: Record<NotificationProvider, NotificationProviderSetting>;
  summaryMetrics: {
    totalDelivered: number;
    deliveryRate: number;
    emailSent: number;
    smsSent: number;
    activeChannelsCount: number;
  };
}

export function renderTemplate(body: string, vars: Record<string, string>): string {
  let rendered = body;
  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    rendered = rendered.replace(regex, value);
  });
  return rendered;
}

