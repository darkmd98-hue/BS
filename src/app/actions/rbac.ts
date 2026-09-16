"use server";

import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export async function saveCustomRoleAction(formData: FormData): Promise<{ success: boolean; error?: string; roleId?: string }> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Unauthorized: Administrator permissions required to manage roles." };
    }

    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const permissionsJson = formData.get("permissions") as string;

    if (!name || name.length < 3) {
      return { success: false, error: "Role name must be at least 3 characters." };
    }

    const permissions: string[] = permissionsJson ? JSON.parse(permissionsJson) : [];
    const supabase = await createClient();

    // Insert or update custom role
    const { data: roleData, error: roleError } = await (supabase as any)
      .from("roles")
      .upsert(
        {
          lodge_id: tenant.lodgeId,
          name,
          description,
          is_system_role: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lodge_id, name" }
      )
      .select("id")
      .single();

    const roleId = roleData?.id || "local-role-" + Date.now();

    if (!roleError && roleData?.id) {
      // Clear old permissions and insert new set
      await (supabase as any)
        .from("role_permissions")
        .delete()
        .eq("role_id", roleData.id);

      if (permissions.length > 0) {
        const permsToInsert = permissions.map((key) => ({
          role_id: roleData.id,
          permission_key: key,
        }));
        await (supabase as any).from("role_permissions").insert(permsToInsert);
      }
    }

    // Write to audit log
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_id: tenant.userId,
      user_email: tenant.userEmail,
      action: "ROLE_CREATED_OR_MODIFIED",
      resource_type: "role",
      resource_id: roleId,
      metadata: { name, permission_count: permissions.length },
    });

    revalidatePath("/admin/roles");
    return { success: true, roleId };
  } catch (err: any) {
    console.error("[saveCustomRoleAction] Error:", err);
    return { success: false, error: err.message || "Failed to save role" };
  }
}

export async function deleteRoleAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Unauthorized: Administrator permissions required." };
    }

    const roleId = formData.get("role_id") as string;
    if (!roleId) {
      return { success: false, error: "Role ID required." };
    }

    const supabase = await createClient();
    await (supabase as any)
      .from("roles")
      .delete()
      .eq("id", roleId)
      .eq("lodge_id", tenant.lodgeId)
      .eq("is_system_role", false);

    // Audit log
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_id: tenant.userId,
      user_email: tenant.userEmail,
      action: "ROLE_DELETED",
      resource_type: "role",
      resource_id: roleId,
    });

    revalidatePath("/admin/roles");
    return { success: true };
  } catch (err: any) {
    console.error("[deleteRoleAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete role" };
  }
}

export async function assignStaffRoleAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    if (tenant.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin privileges required." };
    }

    const targetUserId = formData.get("user_id") as string;
    const newRole = formData.get("role") as string; // 'admin' | 'reception'

    if (!targetUserId || !newRole) {
      return { success: false, error: "Target user and role required." };
    }

    const supabase = await createClient();
    await (supabase as any)
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUserId)
      .eq("lodge_id", tenant.lodgeId);

    // Audit log
    await (supabase as any).from("audit_log").insert({
      lodge_id: tenant.lodgeId,
      user_id: tenant.userId,
      user_email: tenant.userEmail,
      action: "USER_ROLE_ASSIGNED",
      resource_type: "profile",
      resource_id: targetUserId,
      metadata: { new_role: newRole },
    });

    revalidatePath("/admin/roles");
    revalidatePath("/admin/staff");
    return { success: true };
  } catch (err: any) {
    console.error("[assignStaffRoleAction] Error:", err);
    return { success: false, error: err.message || "Failed to assign role" };
  }
}
