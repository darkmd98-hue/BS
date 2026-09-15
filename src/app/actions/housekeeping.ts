"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";

async function createAnonClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as never)); } catch {}
        },
      },
    }
  );
}

export async function startCleaningAction(roomId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createAnonClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const now = new Date().toISOString();

    const { error: roomErr } = await supabase
      .from("rooms")
      .update({
        cleaning_status: "in_progress",
        cleaning_staff_assigned: tenant.profile.full_name || user.email,
      })
      .eq("id", roomId)
      .eq("lodge_id", tenant.lodgeId);

    if (roomErr) return { success: false, error: roomErr.message };

    const { error: logErr } = await supabase
      .from("cleaning_log")
      .insert({
        lodge_id: tenant.lodgeId,
        room_id: roomId,
        cleaned_by_user_id: user.id,
        cleaned_by_name: tenant.profile.full_name || user.email,
        started_at: now,
      });

    if (logErr) return { success: false, error: logErr.message };

    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function markRoomCleanAction(
  roomId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createAnonClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const now = new Date().toISOString();

    const { data: openLog } = await supabase
      .from("cleaning_log")
      .select("id")
      .eq("room_id", roomId)
      .eq("lodge_id", tenant.lodgeId)
      .is("completed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (openLog) {
      await supabase
        .from("cleaning_log")
        .update({ completed_at: now, notes: notes ?? null })
        .eq("id", openLog.id);
    } else {
      await supabase
        .from("cleaning_log")
        .insert({
          lodge_id: tenant.lodgeId,
          room_id: roomId,
          cleaned_by_user_id: user.id,
          cleaned_by_name: tenant.profile.full_name || user.email,
          started_at: now,
          completed_at: now,
          notes: notes ?? null,
        });
    }

    const { error: roomErr } = await supabase
      .from("rooms")
      .update({
        cleaning_status: "clean",
        status: "available",
        last_cleaned_at: now,
        cleaning_staff_assigned: null,
      })
      .eq("id", roomId)
      .eq("lodge_id", tenant.lodgeId);

    if (roomErr) return { success: false, error: roomErr.message };

    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function bulkMarkCleanAction(
  roomIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!roomIds.length) return { success: true };
  try {
    const tenant = await getTenantContext();
    const supabase = await createAnonClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const now = new Date().toISOString();

    const logEntries = roomIds.map((roomId) => ({
      lodge_id: tenant.lodgeId,
      room_id: roomId,
      cleaned_by_user_id: user.id,
      cleaned_by_name: tenant.profile.full_name || user.email,
      started_at: now,
      completed_at: now,
    }));

    await supabase.from("cleaning_log").insert(logEntries);

    const { error } = await supabase
      .from("rooms")
      .update({
        cleaning_status: "clean",
        status: "available",
        last_cleaned_at: now,
        cleaning_staff_assigned: null,
      })
      .in("id", roomIds)
      .eq("lodge_id", tenant.lodgeId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function flagRoomForCleaningAction(
  roomId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createAnonClient();

    const { error } = await supabase
      .from("rooms")
      .update({ cleaning_status: "needs_cleaning" })
      .eq("id", roomId)
      .eq("lodge_id", tenant.lodgeId);

    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
