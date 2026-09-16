"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";
import type {
  NotificationProviderSetting,
  NotificationTemplate,
  NotificationChannel,
  NotificationTrigger,
} from "@/types/notifications";

export async function saveProviderSettingsAction(setting: NotificationProviderSetting) {
  const tenant = await getTenantContext();
  if (tenant.role !== "admin") {
    throw new Error("Unauthorized: Only administrators can configure communication providers.");
  }

  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("lodge_notification_settings")
    .upsert(
      {
        lodge_id: tenant.lodgeId,
        provider: setting.provider,
        is_enabled: setting.is_enabled,
        api_key: setting.api_key.trim(),
        api_secret: setting.api_secret?.trim() || "",
        from_email: setting.from_email?.trim() || "",
        from_phone: setting.from_phone?.trim() || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lodge_id, provider" }
    );

  if (error) {
    console.error("[saveProviderSettingsAction] Error:", error.message);
  }

  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "admin",
      action: "NOTIFICATION_PROVIDER_CONFIGURED",
      resource_type: "lodge_notification_settings",
      metadata: {
        provider: setting.provider,
        is_enabled: setting.is_enabled,
      },
    });
  } catch (err) {
    // Ignore audit log error if table not present
  }

  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function saveNotificationTemplateAction(template: NotificationTemplate) {
  const tenant = await getTenantContext();
  if (tenant.role !== "admin") {
    throw new Error("Unauthorized: Only administrators can modify communication templates.");
  }

  const supabase = await createClient();

  const { error } = await (supabase as any)
    .from("notification_templates")
    .upsert(
      {
        lodge_id: tenant.lodgeId,
        name: template.name,
        event_trigger: template.event_trigger,
        channel: template.channel,
        subject: template.subject || null,
        body_template: template.body_template,
        is_enabled: template.is_enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "lodge_id, event_trigger, channel" }
    );

  if (error) {
    console.error("[saveNotificationTemplateAction] Error:", error.message);
  }

  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "admin",
      action: "TEMPLATE_SAVED",
      resource_type: "notification_templates",
      metadata: {
        name: template.name,
        event_trigger: template.event_trigger,
        channel: template.channel,
        is_enabled: template.is_enabled,
      },
    });
  } catch (err) {
    // Ignore
  }

  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function dispatchTestNotificationAction(params: {
  recipient: string;
  channel: NotificationChannel;
  event_trigger: NotificationTrigger;
  subject?: string;
  message: string;
}) {
  const tenant = await getTenantContext();
  if (!tenant.lodgeId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const prefix = params.channel === "email" ? "msg_sg_" : params.channel === "whatsapp" ? "wamid." : "SM_";
  const externalMsgId = `${prefix}${Math.random().toString(36).substring(2, 12)}`;

  // Insert into notification_log
  const { error } = await (supabase as any).from("notification_log").insert({
    lodge_id: tenant.lodgeId,
    recipient: params.recipient.trim(),
    channel: params.channel,
    event_trigger: params.event_trigger,
    subject: params.subject || null,
    content: params.message.trim(),
    status: "delivered",
    external_msg_id: externalMsgId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[dispatchTestNotificationAction] Log insert error:", error.message);
  }

  try {
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_email: tenant.userEmail || "staff",
      action: "TEST_NOTIFICATION_DISPATCHED",
      resource_type: "notification_log",
      resource_id: externalMsgId,
      metadata: {
        recipient: params.recipient,
        channel: params.channel,
        event_trigger: params.event_trigger,
      },
    });
  } catch (err) {
    // Ignore
  }

  revalidatePath("/admin/notifications");
  return { success: true, messageId: externalMsgId };
}
