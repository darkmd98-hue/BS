"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { registrationLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";
import isEmail from "validator/lib/isEmail";

export interface RegisterLodgeInput {
  email: string;
  password?: string;
  fullName: string;
  lodgeName: string;
  address?: string;
  roomCount?: number;
  subdomain?: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  lodgeId?: string;
  redirectUrl?: string;
}

/**
 * Server action to register a new lodge tenant and initial admin profile.
 *
 * Rules Enforcement:
 * 1. Controlled server-side function via Service Role Client (rules.md §2).
 * 2. Atomic: Auth User creation + Postgres RPC `create_new_lodge_tenant` (lodges + profiles).
 * 3. Client never supplies or sets `lodge_id` — generated server-side.
 * 4. Duplicate email handling per fs.md §6.
 */
export async function registerLodgeAction(
  input: RegisterLodgeInput
): Promise<AuthActionResult> {
  const { email, password, fullName, lodgeName, address } = input;

  // Rate limiting check
  try {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success, reset } = await registrationLimiter.limit(ip);
      if (!success) {
        const waitMin = Math.ceil((reset - Date.now()) / 60000);
        return {
          success: false,
          error: `Too many registration attempts. Try again in ${waitMin} minutes.`,
        };
      }
    }
  } catch (rateLimitErr) {
    console.warn("[RateLimit] Check failed, failing open:", rateLimitErr);
  }

  // 1. Server-side validation
  if (!email || !isEmail(email)) {
    return { success: false, error: "Please provide a valid email address." };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters long.",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      success: false,
      error: "Password must contain at least one uppercase letter.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      success: false,
      error: "Password must contain at least one number.",
    };
  }
  if (!fullName || !fullName.trim()) {
    return { success: false, error: "Owner full name is required." };
  }
  if (!lodgeName || !lodgeName.trim()) {
    return { success: false, error: "Lodge name is required." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFullName = fullName.trim();
  const normalizedLodgeName = lodgeName.trim();
  const normalizedAddress = address?.trim() || null;
  const normalizedSubdomain = input.subdomain?.trim().toLowerCase() || null;

  const RESERVED_SUBDOMAINS = new Set([
    'www', 'admin', 'api', 'app', 'login', 'register', 'install',
    'mail', 'support', 'help', 'status', 'blog', 'docs',
  ]);

  if (normalizedSubdomain) {
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(normalizedSubdomain)) {
      return { success: false, error: 'Subdomain must contain only lowercase letters, numbers, and hyphens.' };
    }
    if (RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
      return { success: false, error: `"${normalizedSubdomain}" is a reserved subdomain. Please choose another.` };
    }
  }

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err: any) {
    console.error("[registerLodgeAction] Supabase admin init error:", err);
    return {
      success: false,
      error: "Database configuration error. Please contact system administrator.",
    };
  }

  let createdUserId: string | null = null;

  try {
    // 2. Create auth.users entry via Supabase Admin Auth
    const { data: userData, error: createAuthError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedFullName,
        },
      });

    if (createAuthError) {
      const msg = createAuthError.message.toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("unique") ||
        msg.includes("duplicate") ||
        createAuthError.status === 422
      ) {
        return {
          success: false,
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }
      return { success: false, error: createAuthError.message };
    }

    if (!userData.user?.id) {
      return {
        success: false,
        error: "Failed to initialize user authentication.",
      };
    }

    createdUserId = userData.user.id;

    // 3. Atomically create the lodges row + profiles row via Postgres RPC
    const { data: tenantData, error: rpcError } = await (adminClient as any).rpc(
      "create_new_lodge_tenant",
      {
        p_user_id: createdUserId,
        p_owner_name: normalizedFullName,
        p_lodge_name: normalizedLodgeName,
        p_address: normalizedAddress,
        p_subdomain: normalizedSubdomain,
      }
    );

    if (rpcError) {
      console.error(
        "[registerLodgeAction] RPC create_new_lodge_tenant failed:",
        rpcError
      );

      // Rollback: Clean up newly created auth user so no orphaned state remains
      if (createdUserId) {
        await adminClient.auth.admin.deleteUser(createdUserId);
      }

      return {
        success: false,
        error:
          rpcError.message ||
          "Failed to create lodge tenant. Transaction was rolled back.",
      };
    }

    // 4. Authenticate the newly registered user session on the server
    try {
      const serverSupabase = await createServerSupabaseClient();
      const { error: signInError } = await serverSupabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });
      if (signInError) {
        console.warn("[registerLodgeAction] Auto-signin failed:", signInError.message);
      }
    } catch (sessionError) {
      console.warn(
        "[registerLodgeAction] Auto-signin cookie set skipped/deferred:",
        sessionError
      );
    }

    return {
      success: true,
      lodgeId: (tenantData as any)?.lodge_id,
      redirectUrl: "/install",
    };
  } catch (unexpectedError: any) {
    console.error("[registerLodgeAction] Unexpected exception:", unexpectedError);

    // Rollback orphaned auth user if created
    if (createdUserId && adminClient) {
      try {
        await adminClient.auth.admin.deleteUser(createdUserId);
      } catch (cleanupErr) {
        console.error(
          "[registerLodgeAction] Failed to cleanup auth user on error:",
          cleanupErr
        );
      }
    }

    return {
      success: false,
      error:
        unexpectedError.message ||
        "An unexpected error occurred during lodge registration.",
    };
  }
}

/**
 * Request password reset email.
 * Always returns success to prevent email enumeration.
 */
export async function requestPasswordResetAction(
  email: string
): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !isEmail(normalizedEmail)) {
    return { success: false, message: "Please provide a valid email address." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${appUrl}/auth/reset-password`,
    });
  } catch (err) {
    console.error("[requestPasswordResetAction] Error:", err);
  }

  // Always return success to prevent email enumeration
  return {
    success: true,
    message: "If that email is registered, a password reset link has been sent.",
  };
}

