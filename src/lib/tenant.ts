import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export interface TenantContext {
  lodgeId: string;
  lodgeSubdomain: string;
  lodgeName: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  profile: Profile;
}

export class TenantMismatchError extends Error {
  constructor(message = "Cross-tenant access denied: authenticated user does not belong to this lodge.") {
    super(message);
    this.name = "TenantMismatchError";
  }
}

export class MissingTenantContextError extends Error {
  constructor(message = "Missing tenant context header (x-lodge-id). Request must go through middleware.") {
    super(message);
    this.name = "MissingTenantContextError";
  }
}

export class UnauthenticatedTenantError extends Error {
  constructor(message = "Authentication required to access tenant context.") {
    super(message);
    this.name = "UnauthenticatedTenantError";
  }
}

/**
 * Server-side helper for Server Components, Route Handlers, and Server Actions.
 *
 * 1. Reads the downstream `x-lodge-id`, `x-lodge-subdomain`, and `x-lodge-name`
 *    headers attached by the subdomain resolution middleware.
 * 2. Authenticates the requesting user session with Supabase.
 * 3. CRITICAL SECURITY GUARD: Compares `profile.lodge_id` against the resolved `x-lodge-id`.
 *    If there is a mismatch (e.g. Lodge A user accessing lakeside.domain), it strictly
 *    throws TenantMismatchError (or rejects access), preventing any blind trust of request headers.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headerList = await headers();
  const headerLodgeId = headerList.get("x-lodge-id");
  const headerSubdomain = headerList.get("x-lodge-subdomain") || "";
  const headerLodgeName = headerList.get("x-lodge-name") || "";

  if (!headerLodgeId) {
    throw new MissingTenantContextError();
  }

  const supabase = await createClient();
  let user: any = null;
  let authError: any = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const authRes = await supabase.auth.getUser();
    user = authRes.data?.user;
    authError = authRes.error;
    if (user || (authError && !authError.message?.toLowerCase().includes("fetch"))) {
      break;
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
    }
  }

  if (authError || !user) {
    throw new UnauthenticatedTenantError(authError?.message || "User is not logged in");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    throw new UnauthenticatedTenantError(profileError?.message || "User profile not found");
  }

  const profile = profileData as Profile;

  // Cross-tenant session mismatch guard
  if (profile.lodge_id !== headerLodgeId) {
    throw new TenantMismatchError('Access denied: cross-tenant access is not permitted.');
  }

  return {
    lodgeId: headerLodgeId,
    lodgeSubdomain: headerSubdomain,
    lodgeName: headerLodgeName,
    userId: user.id,
    userEmail: user.email || "",
    role: profile.role,
    profile,
  };
}

