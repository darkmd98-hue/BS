import { createClient } from "@/lib/supabase/server";

export interface LodgeSettings {
  id: string;
  name: string;
  address: string | null;
  subdomain: string | null;
  logo_url: string | null;
  website: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  currency: string | null;
  timezone: string | null;
  pet_friendly: boolean;
  cancellation_policy: string | null;
  extra_person_charge_default: number | null;
  gst_number: string | null;
  updated_at: string | null;
}

export async function getLodgeSettings(lodgeId: string): Promise<LodgeSettings> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("lodges")
    .select(
      "id, name, address, subdomain, logo_url, website, contact_phone, contact_email, check_in_time, check_out_time, currency, timezone, pet_friendly, cancellation_policy, extra_person_charge_default, gst_number, updated_at"
    )
    .eq("id", lodgeId)
    .single();

  if (error) throw new Error(`Failed to load lodge settings: ${error.message}`);
  return data as LodgeSettings;
}

