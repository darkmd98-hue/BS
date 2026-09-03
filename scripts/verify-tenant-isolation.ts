import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if present in current directory or C:/bs
function loadEnvFile() {
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    "C:/bs/.env.local",
    "C:/bs/.env",
  ];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      console.log(`[Env] Loaded environment from: ${envPath}`);
      return;
    }
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("================================================================================");
  console.error("❌ ERROR: Missing live Supabase environment variables!");
  console.error("================================================================================");
  console.error("Please configure the following in .env.local before running real verification:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>");
  console.error("  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>");
  console.error("================================================================================");
  process.exit(1);
}

// Ensure the URL is not a placeholder
if (SUPABASE_URL.includes("your-project-ref") || SERVICE_ROLE_KEY.includes("your-service-role-key")) {
  console.error("================================================================================");
  console.error("❌ ERROR: Supabase environment variables contain placeholder values.");
  console.error("Please provide live Supabase credentials in .env.local.");
  console.error("================================================================================");
  process.exit(1);
}

async function runLiveSupabaseTenantIsolationVerification() {
  console.log("================================================================================");
  console.log("   LODGE SAAS: LIVE SUPABASE TENANT ISOLATION & RLS VERIFICATION RUNNER");
  console.log("================================================================================");
  console.log(`Target Supabase URL: ${SUPABASE_URL}\n`);

  // Service role client: privileged provisioning
  const adminClient = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const runTag = Date.now().toString(36);
  const emailA = `test-lodge-a-${runTag}@example.com`;
  const emailB = `test-lodge-b-${runTag}@example.com`;
  const testPassword = `TestPass!987_${runTag}`;

  let userAId: string | null = null;
  let userBId: string | null = null;
  let lodgeAId: string | null = null;
  let lodgeBId: string | null = null;

  try {
    // 1. Create real Supabase Auth User A
    console.log("1. CREATING REAL SUPABASE AUTH USER A:");
    const { data: authA, error: errAuthA } = await adminClient.auth.admin.createUser({
      email: emailA,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: "Ramesh Kumar (Lodge A Admin)" },
    });

    if (errAuthA || !authA.user) {
      throw new Error(`Failed to create Auth User A: ${errAuthA?.message}`);
    }
    userAId = authA.user.id;
    console.log(`   - Auth User A ID (Supabase UUID): ${userAId}`);
    console.log(`   - Email:                           ${emailA}`);

    // 2. Call real RPC create_new_lodge_tenant for Lodge A
    console.log("\n2. PROVISIONING LODGE A (ATOMIC RPC TRANSACTION):");
    const { data: tenantA, error: errTenantA } = await adminClient.rpc("create_new_lodge_tenant", {
      p_user_id: userAId,
      p_owner_name: "Ramesh Kumar",
      p_lodge_name: "Hill View Heritage Lodge",
      p_address: "Main Road, Sringeri, Karnataka",
    });

    if (errTenantA || !tenantA) {
      throw new Error(`RPC create_new_lodge_tenant failed for Lodge A: ${errTenantA?.message}`);
    }
    lodgeAId = (tenantA as any).lodge_id;
    console.log(`   - Lodge A ID (Postgres UUID):     ${lodgeAId}`);
    console.log(`   - Lodge A Name:                   ${(tenantA as any).lodge_name}`);
    console.log(`   - Role Assigned:                  ${(tenantA as any).role}`);

    // 3. Create real Supabase Auth User B
    console.log("\n3. CREATING REAL SUPABASE AUTH USER B (SECOND TENANT):");
    const { data: authB, error: errAuthB } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: "Ananya Sharma (Lodge B Admin)" },
    });

    if (errAuthB || !authB.user) {
      throw new Error(`Failed to create Auth User B: ${errAuthB?.message}`);
    }
    userBId = authB.user.id;
    console.log(`   - Auth User B ID (Supabase UUID): ${userBId}`);
    console.log(`   - Email:                           ${emailB}`);

    // 4. Call real RPC create_new_lodge_tenant for Lodge B
    console.log("\n4. PROVISIONING LODGE B (ATOMIC RPC TRANSACTION):");
    const { data: tenantB, error: errTenantB } = await adminClient.rpc("create_new_lodge_tenant", {
      p_user_id: userBId,
      p_owner_name: "Ananya Sharma",
      p_lodge_name: "Riverwood Mountain Estate",
      p_address: "River Road, Chikmagalur, Karnataka",
    });

    if (errTenantB || !tenantB) {
      throw new Error(`RPC create_new_lodge_tenant failed for Lodge B: ${errTenantB?.message}`);
    }
    lodgeBId = (tenantB as any).lodge_id;
    console.log(`   - Lodge B ID (Postgres UUID):     ${lodgeBId}`);
    console.log(`   - Lodge B Name:                   ${(tenantB as any).lodge_name}`);
    console.log(`   - Role Assigned:                  ${(tenantB as any).role}`);

    // 5. Test Duplicate Registration Prevention on live database
    console.log("\n5. TESTING DUPLICATE REGISTRATION PREVENTION (LIVE RPC):");
    const { data: dupData, error: dupError } = await adminClient.rpc("create_new_lodge_tenant", {
      p_user_id: userAId,
      p_owner_name: "Ramesh Duplicate Attempt",
      p_lodge_name: "Duplicate Lodge",
      p_address: "Duplicate Address",
    });

    if (!dupError) {
      throw new Error("Duplicate registration was NOT rejected by the database function!");
    }
    console.log(`   [Action] Attempt second tenant creation with existing User A (${userAId})`);
    console.log(`   [Result] Rejected by Postgres constraint/check: "${dupError.message}"`);
    console.log("   ✅ PASSED: Duplicate registration correctly prevented by database.");

    // 6. Authenticate as User A (Client-side anon client with real session)
    console.log("\n6. AUTHENTICATING CLIENT AS USER A (LODGE A ADMIN):");
    const clientA = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: loginA, error: errLoginA } = await clientA.auth.signInWithPassword({
      email: emailA,
      password: testPassword,
    });

    if (errLoginA || !loginA.session) {
      throw new Error(`Failed to log in as User A: ${errLoginA?.message}`);
    }
    console.log(`   - Authenticated JWT sub: ${loginA.session.user.id}`);
    console.log(`   - Session role:          ${loginA.session.user.role}`);

    // 7. Execute Real RLS Queries as Lodge A's Authenticated User
    console.log("\n7. EXECUTING LIVE POSTGRES RLS QUERIES AS LODGE A USER:");

    // Query 7.1: SELECT * FROM lodges
    console.log("\n   --- Query 7.1: SELECT * FROM lodges ---");
    const { data: lodgesAll, error: errLodgesAll } = await clientA
      .from("lodges")
      .select("*");

    if (errLodgesAll) {
      throw new Error(`Query 7.1 failed: ${errLodgesAll.message}`);
    }
    console.log(`   [Query Result] Rows returned: ${lodgesAll?.length}`);
    console.log(`   [Returned Lodges]:`, JSON.stringify(lodgesAll, null, 2));

    if (!lodgesAll || lodgesAll.length !== 1 || lodgesAll[0].id !== lodgeAId) {
      throw new Error(`RLS VIOLATION: User A received unexpected lodges data: ${JSON.stringify(lodgesAll)}`);
    }
    console.log("   ✅ PASSED: Postgres RLS allowed User A to see only their own lodge.");

    // Query 7.2: SELECT * FROM lodges WHERE id = <Lodge B ID>
    console.log(`\n   --- Query 7.2: SELECT * FROM lodges WHERE id = '${lodgeBId}' ---`);
    const { data: targetLodgeB, error: errTargetB } = await clientA
      .from("lodges")
      .select("*")
      .eq("id", lodgeBId);

    if (errTargetB) {
      throw new Error(`Query 7.2 failed: ${errTargetB.message}`);
    }
    console.log(`   [Query Result] Rows returned: ${targetLodgeB?.length}`);
    console.log(`   [Returned Data]:`, JSON.stringify(targetLodgeB, null, 2));

    if (!targetLodgeB || targetLodgeB.length !== 0) {
      throw new Error(`RLS VIOLATION: User A was able to read Lodge B's row!`);
    }
    console.log("   ✅ PASSED: Direct query for Lodge B returned 0 rows (rejected at PostgreSQL RLS level).");

    // Query 7.3: SELECT * FROM profiles WHERE lodge_id = <Lodge B ID>
    console.log(`\n   --- Query 7.3: SELECT * FROM profiles WHERE lodge_id = '${lodgeBId}' ---`);
    const { data: targetProfilesB, error: errProfilesB } = await clientA
      .from("profiles")
      .select("*")
      .eq("lodge_id", lodgeBId);

    if (errProfilesB) {
      throw new Error(`Query 7.3 failed: ${errProfilesB.message}`);
    }
    console.log(`   [Query Result] Rows returned: ${targetProfilesB?.length}`);
    console.log(`   [Returned Data]:`, JSON.stringify(targetProfilesB, null, 2));

    if (!targetProfilesB || targetProfilesB.length !== 0) {
      throw new Error(`RLS VIOLATION: User A was able to read Lodge B's profiles!`);
    }
    console.log("   ✅ PASSED: Query for Lodge B's profiles returned 0 rows (rejected at PostgreSQL RLS level).");

    // Query 7.4: UPDATE lodges SET name = 'Hacked' WHERE id = <Lodge B ID>
    console.log(`\n   --- Query 7.4: UPDATE lodges SET name = 'Hacked' WHERE id = '${lodgeBId}' ---`);
    const { data: updateRes, error: errUpdate } = await clientA
      .from("lodges")
      .update({ name: "Hacked by Lodge A" })
      .eq("id", lodgeBId)
      .select();

    console.log(`   [Query Result] Rows updated: ${updateRes?.length || 0}`);
    if (updateRes && updateRes.length > 0) {
      throw new Error(`RLS VIOLATION: User A was able to modify Lodge B!`);
    }
    console.log("   ✅ PASSED: Unauthorized update on Lodge B rejected at PostgreSQL RLS level (0 rows updated).");

    console.log("\n================================================================================");
    console.log("🎉 ALL REAL SUPABASE TENANT ISOLATION & RLS VERIFICATIONS PASSED!");
    console.log("   - User A Supabase UUID:  " + userAId);
    console.log("   - Lodge A Postgres UUID: " + lodgeAId);
    console.log("   - User B Supabase UUID:  " + userBId);
    console.log("   - Lodge B Postgres UUID: " + lodgeBId);
    console.log("================================================================================");

  } finally {
    // Clean up test users if created
    console.log("\n[Cleanup] Cleaning up temporary test users and tenants from live database...");
    if (userAId) {
      await adminClient.auth.admin.deleteUser(userAId).catch((e) => console.warn("Cleanup User A warning:", e.message));
    }
    if (userBId) {
      await adminClient.auth.admin.deleteUser(userBId).catch((e) => console.warn("Cleanup User B warning:", e.message));
    }
    if (lodgeAId) {
      await adminClient.from("lodges").delete().eq("id", lodgeAId).catch((e) => console.warn("Cleanup Lodge A warning:", e.message));
    }
    if (lodgeBId) {
      await adminClient.from("lodges").delete().eq("id", lodgeBId).catch((e) => console.warn("Cleanup Lodge B warning:", e.message));
    }
    console.log("[Cleanup] Finished.");
  }
}

runLiveSupabaseTenantIsolationVerification().catch((err) => {
  console.error("\n❌ VERIFICATION RUN FAILED WITH ERROR:");
  console.error(err);
  process.exit(1);
});
