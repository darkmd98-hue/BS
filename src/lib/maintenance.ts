import { createClient } from "@/lib/supabase/server";

export type IssueType =
  | "ac_heating"
  | "plumbing"
  | "electrical"
  | "structural"
  | "furnishings"
  | "appliances"
  | "other";

export type Priority = "low" | "medium" | "high" | "urgent";

export type TicketStatus = "open" | "in_progress" | "resolved";

export interface MaintenanceTicket {
  id: string;
  lodge_id: string;
  room_id: string | null;
  reported_by_user_id: string | null;
  reported_by_name: string | null;
  issue_type: IssueType;
  description: string;
  priority: Priority;
  status: TicketStatus;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  room?: {
    id: string;
    room_number: string;
    room_type: string;
    floor: number | null;
  } | null;
}

export interface MaintenanceRoomOption {
  id: string;
  room_number: string;
  room_type: string;
  floor: number | null;
}

export interface MaintenanceStaffOption {
  id: string;
  full_name: string;
  role: string;
}

export async function getMaintenanceTickets(lodgeId: string): Promise<MaintenanceTicket[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("maintenance_tickets")
    .select("*, room:rooms(id, room_number, room_type, floor)")
    .eq("lodge_id", lodgeId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load maintenance tickets: ${error.message}`);
  return (data ?? []) as MaintenanceTicket[];
}

export async function getMaintenanceRooms(lodgeId: string): Promise<MaintenanceRoomOption[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("rooms")
    .select("id, room_number, room_type, floor")
    .eq("lodge_id", lodgeId)
    .order("room_number", { ascending: true });

  if (error) throw new Error(`Failed to load rooms for maintenance: ${error.message}`);
  return (data ?? []) as MaintenanceRoomOption[];
}

export async function getMaintenanceStaff(lodgeId: string): Promise<MaintenanceStaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id, full_name, role")
    .eq("lodge_id", lodgeId)
    .order("full_name", { ascending: true });

  if (error) throw new Error(`Failed to load staff for maintenance: ${error.message}`);
  return (data ?? []) as MaintenanceStaffOption[];
}

