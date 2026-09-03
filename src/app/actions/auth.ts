"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface RegisterLodgeInput {
  email: string;
  password?: string;
  fullName: string;
  lodgeName: string;
  address?: string;
  roomCount?: number;
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

  // 1. Server-side validation
  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }
  if (!password || password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
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
    const { data: tenantData, error: rpcError } = await adminClient.rpc(
      "create_new_lodge_tenant",
      {
        p_user_id: createdUserId,
        p_owner_name: normalizedFullName,
        p_lodge_name: normalizedLodgeName,
        p_address: normalizedAddress,
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
      await serverSupabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });
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
