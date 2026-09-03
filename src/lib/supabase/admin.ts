import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Privileged Supabase client using the Service Role Key.
 *
 * CRITICAL SECURITY NOTICE:
 * This client bypasses Row Level Security (RLS).
 * It must NEVER be used on the client side, exposed in public API responses,
 * or used for general user queries.
 *
 * ONLY permitted for:
 * 1. Initial tenant onboarding in server actions (creating lodges + initial admin profile)
 * 2. System background jobs or webhooks
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
