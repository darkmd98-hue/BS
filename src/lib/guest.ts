import { createAdminClient } from "@/lib/supabase/admin";

export interface GuestReservationData {
  reservation: {
    id: string;
    lodge_id: string;
    customer_id: string;
    room_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    advance: number;
    status: string;
    special_request: string | null;
    created_at: string;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    mobile: string;
  };
  room: {
    id: string;
    room_number: string;
    floor: number | null;
    room_type: string;
    bed_type: string;
    capacity: number;
    rent: number;
  };
  bill: {
    id: string;
    net_amount: number;
    received: number;
    balance: number;
    payment_status: string;
    created_at: string;
  } | null;
  lodge: {
    id: string;
    name: string;
    address: string | null;
    subdomain: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    cancellation_policy: string | null;
    pet_friendly: boolean;
  };
  messages: Array<{
    id: string;
    sender: "guest" | "staff";
    sender_name: string;
    message: string;
    created_at: string;
  }>;
}

/**
 * Fetch all details needed for the guest portal for a single reservation,
 * strictly validating that the reservation belongs to the resolved lodge.
 */
export async function getGuestReservationDetails(
  reservationId: string,
  lodgeId: string
): Promise<GuestReservationData | null> {
  const admin = createAdminClient();

  // 1. Fetch reservation scoped by lodge_id
  const { data: resData, error: resError } = await (admin as any)
    .from("reservations")
    .select("*")
    .eq("id", reservationId)
    .eq("lodge_id", lodgeId)
    .single();

  if (resError || !resData) {
    return null;
  }

  // 2. Fetch customer
  const { data: custData } = await (admin as any)
    .from("customers")
    .select("id, name, email, mobile")
    .eq("id", resData.customer_id)
    .eq("lodge_id", lodgeId)
    .single();

  // 3. Fetch room
  const { data: roomData } = await (admin as any)
    .from("rooms")
    .select("id, room_number, floor, room_type, bed_type, capacity, rent")
    .eq("id", resData.room_id)
    .eq("lodge_id", lodgeId)
    .single();

  // 4. Fetch bill
  const { data: billData } = await (admin as any)
    .from("bills")
    .select("id, net_amount, received, balance, payment_status, created_at")
    .eq("reservation_id", reservationId)
    .eq("lodge_id", lodgeId)
    .maybeSingle();

  // 5. Fetch lodge settings
  const { data: lodgeData } = await (admin as any)
    .from("lodges")
    .select(
      "id, name, address, subdomain, contact_phone, contact_email, check_in_time, check_out_time, cancellation_policy, pet_friendly"
    )
    .eq("id", lodgeId)
    .single();

  // 6. Fetch guest messages (safely handling table if migration is pending)
  let messages: any[] = [];
  try {
    const { data: msgData, error: msgError } = await (admin as any)
      .from("guest_messages")
      .select("id, sender, sender_name, message, created_at")
      .eq("reservation_id", reservationId)
      .eq("lodge_id", lodgeId)
      .order("created_at", { ascending: true });

    if (!msgError && msgData) {
      messages = msgData;
    }
  } catch {
    messages = [];
  }

  return {
    reservation: resData,
    customer: custData || {
      id: resData.customer_id,
      name: "Guest",
      email: null,
      mobile: "",
    },
    room: roomData || {
      id: resData.room_id,
      room_number: "Room",
      floor: 1,
      room_type: "Standard",
      bed_type: "Single",
      capacity: 2,
      rent: 1500,
    },
    bill: billData || null,
    lodge: lodgeData || {
      id: lodgeId,
      name: "Lodge",
      address: null,
      subdomain: null,
      contact_phone: null,
      contact_email: null,
      check_in_time: "14:00",
      check_out_time: "11:00",
      cancellation_policy: "flexible",
      pet_friendly: false,
    },
    messages,
  };
}

