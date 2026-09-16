"use server";

import { getTenantContext } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can create organizations." };
    }

    const orgName = (formData.get("organization_name") as string)?.trim();
    if (!orgName) {
      return { success: false, error: "Organization name is required." };
    }

    const admin = createAdminClient();

    // Create user_organizations record
    const { data: org, error: orgError } = await (admin as any)
      .from("user_organizations")
      .insert({
        user_id: tenant.userId,
        organization_name: orgName,
        role: "owner",
      })
      .select("id")
      .single();

    if (orgError) {
      return { success: false, error: orgError.message };
    }

    // Link current lodge to this organization
    await (admin as any)
      .from("lodges")
      .update({ organization_id: org.id })
      .eq("id", tenant.lodgeId);

    revalidatePath("/admin/multi-property");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create organization",
    };
  }
}

export async function reassignStaffAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Only administrators can reassign staff." };
    }

    const staffId = (formData.get("staff_id") as string)?.trim();
    const targetLodgeId = (formData.get("target_lodge_id") as string)?.trim();

    if (!staffId || !targetLodgeId) {
      return { success: false, error: "Missing staff or destination property ID." };
    }

    const admin = createAdminClient();

    const { error } = await (admin as any)
      .from("profiles")
      .update({ lodge_id: targetLodgeId })
      .eq("id", staffId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/multi-property");
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reassign staff",
    };
  }
}

