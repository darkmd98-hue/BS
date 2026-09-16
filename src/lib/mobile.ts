import { createClient } from "@/lib/supabase/server";
import type {
  MobileStaffData,
  MobileRoomTask,
  MobileMaintenanceTicket,
} from "@/types/mobile";

export * from "@/types/mobile";

export async function getMobileStaffData(
  lodgeId: string,
  lodgeName: string,
  lodgeSubdomain: string,
  user: { id: string; name: string; email: string; role: string }
): Promise<MobileStaffData> {
  const supabase = await createClient();

  const [{ data: roomsData }, { data: ticketsData }] = await Promise.all([
    (supabase as any)
      .from("rooms")
      .select("id, room_number, floor, status, room_type, last_cleaned_at, cleaning_staff_assigned")
      .eq("lodge_id", lodgeId)
      .order("room_number", { ascending: true }),
    (supabase as any)
      .from("maintenance_tickets")
      .select("id, room_id, issue_type, description, priority, status, created_at, assigned_to_user_id, rooms(room_number)")
      .eq("lodge_id", lodgeId)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false }),
  ]);

  const rawRooms = roomsData || [];
  const rawTickets = ticketsData || [];

  // Filter or prioritize rooms needing cleaning or active
  const cleaningQueue: MobileRoomTask[] = rawRooms
    .filter((r: any) => r.status === "cleaning" || r.status === "occupied" || r.status === "maintenance")
    .map((r: any) => ({
      id: r.id,
      roomNumber: r.room_number || "Unknown",
      floor: r.floor,
      status: r.status,
      roomType: r.room_type || "Deluxe",
      lastCleanedAt: r.last_cleaned_at,
      assignedStaff: r.cleaning_staff_assigned,
    }));

  const maintenanceTickets: MobileMaintenanceTicket[] = rawTickets.map((t: any) => ({
    id: t.id,
    roomNumber: t.rooms?.room_number || "Common Area",
    issueType: t.issue_type || "General",
    description: t.description,
    priority: t.priority || "medium",
    status: t.status,
    assignedTo: t.assigned_to_user_id,
    createdAt: t.created_at,
  }));

  const urgentCount = maintenanceTickets.filter(
    (t) => t.priority === "urgent" || t.priority === "high"
  ).length;

  return {
    lodgeId,
    lodgeName,
    lodgeSubdomain,
    staffUser: user,
    cleaningQueue,
    maintenanceTickets,
    metrics: {
      pendingCleaningCount: cleaningQueue.filter((r) => r.status === "cleaning").length,
      urgentMaintenanceCount: urgentCount,
      totalActiveTasks: cleaningQueue.length + maintenanceTickets.length,
    },
  };
}

