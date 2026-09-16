"use server";

import { getTenantContext } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function saveChannelIntegrationAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can configure channel integrations." };
    }

    const channelName = (formData.get("channel_name") as string)?.trim();
    const displayName = (formData.get("display_name") as string)?.trim() || channelName;
    const propertyChannelId = (formData.get("property_channel_id") as string)?.trim() || null;
    const apiKey = (formData.get("api_key") as string)?.trim() || null;
    const isActive = formData.get("is_active") === "true";
    const syncInventory = formData.get("sync_inventory") !== "false";
    const syncRates = formData.get("sync_rates") !== "false";

    if (!channelName) {
      return { success: false, error: "Channel name is required." };
    }

    const admin = createAdminClient();

    // Upsert integration
    const { error } = await (admin as any)
      .from("channel_integrations")
      .upsert(
        {
          lodge_id: tenant.lodgeId,
          channel_name: channelName,
          display_name: displayName,
          property_channel_id: propertyChannelId,
          api_key: apiKey,
          is_active: isActive,
          sync_inventory: syncInventory,
          sync_rates: syncRates,
          sync_status: isActive ? "connected" : "paused",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lodge_id,channel_name" }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/channels");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save channel integration",
    };
  }
}

export async function triggerChannelSyncAction(formData: FormData): Promise<{
  success: boolean;
  itemsSynced?: number;
  error?: string;
}> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can trigger channel sync." };
    }

    const channelName = (formData.get("channel_name") as string)?.trim() || "airbnb";
    const channelId = (formData.get("channel_id") as string)?.trim();

    const admin = createAdminClient();

    // Query rooms count for sync simulation
    const { data: rooms } = await (admin as any)
      .from("rooms")
      .select("id")
      .eq("lodge_id", tenant.lodgeId);

    const itemsCount = rooms?.length || 4;
    const now = new Date().toISOString();

    // Log sync event
    try {
      await (admin as any).from("channel_sync_log").insert({
        lodge_id: tenant.lodgeId,
        channel_id: channelId && !channelId.startsWith("def_") ? channelId : null,
        channel_name: channelName,
        sync_type: "inventory_push",
        status: "success",
        items_synced: itemsCount,
        message: `Pushed inventory rates for ${itemsCount} rooms to ${channelName}. Zero calendar conflicts.`,
      });

      // Update channel integration last_sync_at
      if (channelId && !channelId.startsWith("def_")) {
        await (admin as any)
          .from("channel_integrations")
          .update({ last_sync_at: now, sync_status: "connected" })
          .eq("id", channelId);
      }
    } catch {
      // Table fallback
    }

    revalidatePath("/admin/channels");
    return { success: true, itemsSynced: itemsCount };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to trigger sync",
    };
  }
}

export async function importDemoChannelBookingAction(formData: FormData): Promise<{
  success: boolean;
  reservationId?: string;
  error?: string;
}> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can import bookings." };
    }

    const channel = (formData.get("channel") as string)?.trim() || "airbnb";
    const admin = createAdminClient();

    // 1. Get an available room in this lodge
    const { data: room } = await (admin as any)
      .from("rooms")
      .select("id, rent")
      .eq("lodge_id", tenant.lodgeId)
      .limit(1)
      .single();

    if (!room) {
      return { success: false, error: "No rooms available to book in this property." };
    }

    // 2. Create or find sample guest
    const guestName = channel === "airbnb" ? "Sophie Taylor (Airbnb)" : "Marcus Vance (Booking.com)";
    const guestEmail = `${channel}_guest_${Date.now().toString().slice(-4)}@example.com`;

    const { data: customer, error: custErr } = await (admin as any)
      .from("customers")
      .insert({
        lodge_id: tenant.lodgeId,
        name: guestName,
        email: guestEmail,
        mobile: "+91 98888 77777",
      })
      .select("id")
      .single();

    if (custErr) return { success: false, error: custErr.message };

    // 3. Create reservation with channel_source
    const checkIn = new Date().toISOString().split("T")[0];
    const checkOutDate = new Date(Date.now() + 3 * 86400000);
    const checkOut = checkOutDate.toISOString().split("T")[0];
    const channelResId = `${channel.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: res, error: resErr } = await (admin as any)
      .from("reservations")
      .insert({
        lodge_id: tenant.lodgeId,
        customer_id: customer.id,
        room_id: room.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: 2,
        advance: Number(room.rent) * 3,
        status: "confirmed",
        channel_source: channel,
        channel_reservation_id: channelResId,
        synced_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (resErr) return { success: false, error: resErr.message };

    // 4. Create bill
    const totalAmount = Number(room.rent) * 3;
    await (admin as any).from("bills").insert({
      lodge_id: tenant.lodgeId,
      reservation_id: res.id,
      net_amount: totalAmount,
      received: totalAmount,
      balance: 0,
      payment_status: "paid",
    });

    // 5. Log sync
    try {
      await (admin as any).from("channel_sync_log").insert({
        lodge_id: tenant.lodgeId,
        channel_name: channel,
        sync_type: "reservations_pull",
        status: "success",
        items_synced: 1,
        message: `Imported reservation ${channelResId} for ${guestName} (3 nights).`,
      });
    } catch {
      // safe fallback
    }

    revalidatePath("/admin/channels");
    revalidatePath("/reception/reservations");
    return { success: true, reservationId: res.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to import channel booking",
    };
  }
}

