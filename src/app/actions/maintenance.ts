"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "@/lib/tenant";
import type { Priority, IssueType, TicketStatus } from "@/lib/maintenance";

export async function createMaintenanceTicketAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const roomId = (formData.get("roomId") as string)?.trim() || null;
    const issueType = (formData.get("issueType") as IssueType) || "other";
    const description = (formData.get("description") as string)?.trim();
    const priority = (formData.get("priority") as Priority) || "medium";
    const assignedToUserId = (formData.get("assignedToUserId") as string)?.trim() || null;
    const assignedToName = (formData.get("assignedToName") as string)?.trim() || null;

    if (!description) {
      return { success: false, error: "Description is required" };
    }

    const { error: insertError } = await (supabase as any)
      .from("maintenance_tickets")
      .insert({
        lodge_id: tenant.lodgeId,
        room_id: roomId,
        reported_by_user_id: user.id,
        reported_by_name: tenant.profile.full_name || user.email,
        issue_type: issueType,
        description,
        priority,
        status: "open",
        assigned_to_user_id: assignedToUserId,
        assigned_to_name: assignedToName,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // If assigned to a room and priority is high or urgent, update room's maintenance status
    if (roomId && (priority === "urgent" || priority === "high")) {
      await (supabase as any)
        .from("rooms")
        .update({
          status: "maintenance",
          maintenance_issue: description,
          maintenance_priority: priority,
        })
        .eq("id", roomId)
        .eq("lodge_id", tenant.lodgeId);
    }

    revalidatePath("/admin/maintenance");
    revalidatePath("/reception/rooms");
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function updateTicketStatusAction(
  ticketId: string,
  status: TicketStatus,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createClient();

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    if (status === "resolved") {
      updatePayload.resolved_at = now;
      if (resolutionNotes) {
        updatePayload.resolution_notes = resolutionNotes.trim();
      }
    } else {
      updatePayload.resolved_at = null;
    }

    // Get current ticket to know roomId
    const { data: ticket } = await (supabase as any)
      .from("maintenance_tickets")
      .select("id, room_id")
      .eq("id", ticketId)
      .eq("lodge_id", tenant.lodgeId)
      .single();

    if (!ticket) {
      return { success: false, error: "Ticket not found or unauthorized" };
    }

    const { error: updateError } = await (supabase as any)
      .from("maintenance_tickets")
      .update(updatePayload)
      .eq("id", ticketId)
      .eq("lodge_id", tenant.lodgeId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // If ticket was resolved and linked to a room, check if any other open/in_progress tickets remain
    if (status === "resolved" && ticket.room_id) {
      const { data: activeRemaining } = await (supabase as any)
        .from("maintenance_tickets")
        .select("id")
        .eq("room_id", ticket.room_id)
        .eq("lodge_id", tenant.lodgeId)
        .in("status", ["open", "in_progress"]);

      if (!activeRemaining || activeRemaining.length === 0) {
        // Return room to available if it was in maintenance
        await (supabase as any)
          .from("rooms")
          .update({
            status: "available",
            maintenance_issue: null,
            maintenance_priority: null,
          })
          .eq("id", ticket.room_id)
          .eq("status", "maintenance")
          .eq("lodge_id", tenant.lodgeId);
      }
    }

    revalidatePath("/admin/maintenance");
    revalidatePath("/reception/rooms");
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function assignTicketAction(
  ticketId: string,
  assignedToUserId: string | null,
  assignedToName: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenant = await getTenantContext();
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .from("maintenance_tickets")
      .update({
        assigned_to_user_id: assignedToUserId || null,
        assigned_to_name: assignedToName || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .eq("lodge_id", tenant.lodgeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

