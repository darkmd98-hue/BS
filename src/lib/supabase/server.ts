import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

export const createServerSupabaseClient = createClient;

/**
 * Server-side helper to fetch authenticated user and verify their profile + lodge_id.
 * Never trust a client-supplied lodge_id.
 */
export async function getAuthenticatedUserWithLodge() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, profile: null, lodge: null, error: authError || new Error("Not authenticated") };
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .select("*, lodges(*)")
    .eq("id", user.id)
    .single();

  if (profileError || !data) {
    return { user, profile: null, lodge: null, error: profileError || new Error("Profile not found") };
  }

  const profile = data as any;

  return {
    user,
    profile,
    lodge: profile.lodges,
    error: null,
  };
}
