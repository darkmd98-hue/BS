"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";

export async function updateLodgeSettingsAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can update settings." };
    }

    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      name: (formData.get("name") as string)?.trim() || undefined,
      address: (formData.get("address") as string)?.trim() || null,
      contact_phone: (formData.get("contact_phone") as string)?.trim() || null,
      contact_email: (formData.get("contact_email") as string)?.trim() || null,
      website: (formData.get("website") as string)?.trim() || null,
      check_in_time: (formData.get("check_in_time") as string)?.trim() || "14:00",
      check_out_time: (formData.get("check_out_time") as string)?.trim() || "11:00",
      currency: (formData.get("currency") as string)?.trim() || "INR",
      timezone: (formData.get("timezone") as string)?.trim() || "Asia/Kolkata",
      pet_friendly: formData.get("pet_friendly") === "true",
      cancellation_policy: (formData.get("cancellation_policy") as string)?.trim() || "flexible",
      extra_person_charge_default: parseFloat(
        (formData.get("extra_person_charge_default") as string) || "500"
      ),
      gst_number: (formData.get("gst_number") as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Validate lodge name
    if (!updates.name) {
      return { success: false, error: "Lodge name is required." };
    }

    const { error } = await (supabase as any)
      .from("lodges")
      .update(updates)
      .eq("id", tenant.lodgeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin"); // sidebar shows lodge name
    revalidatePath("/reception"); // header shows lodge name
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

