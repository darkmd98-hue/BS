"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export async function quickUpdateRoomStatusAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const roomId = formData.get("room_id") as string;
    const newStatus = formData.get("status") as string;

    if (!roomId || !newStatus) {
      return { success: false, error: "Missing room or status parameter." };
    }

    const supabase = await createClient();
    const updateData: any = {
      status: newStatus,
    };
    if (newStatus === "available") {
      updateData.last_cleaned_at = new Date().toISOString();
      updateData.cleaning_staff_assigned = tenant.userEmail;
    }

    const { error } = await (supabase as any)
      .from("rooms")
      .update(updateData)
      .eq("id", roomId)
      .eq("lodge_id", tenant.lodgeId);

    if (error) {
      console.warn("[quickUpdateRoomStatusAction] Update error:", error.message);
    }

    revalidatePath("/mobile");
    revalidatePath("/admin/housekeeping");
    revalidatePath("/reception/rooms");
    return { success: true };
  } catch (err: any) {
    console.error("[quickUpdateRoomStatusAction] Error:", err);
    return { success: false, error: err.message || "Failed to update room status" };
  }
}

export async function registerStaffDeviceAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const deviceToken = (formData.get("device_token") as string)?.trim();
    const platform = (formData.get("platform") as string)?.trim() || "web";
    const deviceName = (formData.get("device_name") as string)?.trim() || "Mobile Companion Client";

    if (!deviceToken) {
      return { success: false, error: "Device token is required." };
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from("staff_device_tokens")
      .upsert(
        {
          lodge_id: tenant.lodgeId,
          user_id: tenant.userId,
          device_token: deviceToken,
          platform,
          device_name: deviceName,
          is_active: true,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "lodge_id, user_id, device_token" }
      );

    if (error) {
      console.warn("[registerStaffDeviceAction] Warning:", error.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("[registerStaffDeviceAction] Error:", err);
    return { success: false, error: err.message || "Failed to register device" };
  }
}

export async function syncMobileTasksAction(formData: FormData): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const itemsJson = formData.get("items") as string;
    if (!itemsJson) {
      return { success: true, syncedCount: 0 };
    }

    const items = JSON.parse(itemsJson);
    const supabase = await createClient();
    let synced = 0;

    for (const item of items) {
      if (item.type === "MARK_ROOM_CLEANED") {
        await (supabase as any)
          .from("rooms")
          .update({
            status: "available",
            last_cleaned_at: item.timestamp || new Date().toISOString(),
            cleaning_staff_assigned: tenant.userEmail,
          })
          .eq("id", item.targetId)
          .eq("lodge_id", tenant.lodgeId);
        synced++;
      } else if (item.type === "RESOLVE_TICKET") {
        await (supabase as any)
          .from("maintenance_tickets")
          .update({
            status: "resolved",
            resolved_at: item.timestamp || new Date().toISOString(),
            resolution_notes: item.payload?.notes || "Resolved via mobile companion",
          })
          .eq("id", item.targetId)
          .eq("lodge_id", tenant.lodgeId);
        synced++;
      }
    }

    revalidatePath("/mobile");
    revalidatePath("/admin/housekeeping");
    revalidatePath("/admin/maintenance");
    return { success: true, syncedCount: synced };
  } catch (err: any) {
    console.error("[syncMobileTasksAction] Error:", err);
    return { success: false, syncedCount: 0, error: err.message || "Failed to sync offline items" };
  }
}

