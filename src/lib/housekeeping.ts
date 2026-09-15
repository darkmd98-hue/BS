import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type CleaningStatus = "clean" | "needs_cleaning" | "in_progress";

export interface RoomCleaningState {
  id: string;
  room_number: string;
  floor: number | null;
  room_type: string;
  status: string;
  cleaning_status: CleaningStatus;
  cleaning_staff_assigned: string | null;
  last_cleaned_at: string | null;
}

export interface CleaningLogEntry {
  id: string;
  room_id: string;
  lodge_id: string;
  cleaned_by_user_id: string | null;
  cleaned_by_name: string | null;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  room?: { room_number: string };
}

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {}
        },
      },
    }
  );
}

/** Rooms that need cleaning or are currently being cleaned */
export async function getRoomsNeedingCleaning(lodgeId: string): Promise<RoomCleaningState[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, room_number, floor, room_type, status, cleaning_status, cleaning_staff_assigned, last_cleaned_at")
    .eq("lodge_id", lodgeId)
    .in("cleaning_status", ["needs_cleaning", "in_progress"])
    .order("room_number");

  if (error) throw new Error(`Failed to load rooms: ${error.message}`);
  return (data ?? []) as RoomCleaningState[];
}

/** Recent cleaning log entries (latest 100) */
export async function getCleaningLog(lodgeId: string): Promise<CleaningLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cleaning_log")
    .select("*, room:rooms(room_number)")
    .eq("lodge_id", lodgeId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Failed to load cleaning log: ${error.message}`);
  return (data ?? []) as CleaningLogEntry[];
}
