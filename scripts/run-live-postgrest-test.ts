import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
content.split("\n").forEach((l) => {
  const eq = l.indexOf("=");
  if (eq > 0) {
    const key = l.slice(0, eq).trim();
    const val = l.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

async function runLivePostgrestTest() {
  console.log("================================================================================");
  console.log("       LIVE POSTGREST RLS TENANT ISOLATION TEST (ANON KEY + REAL JWT)           ");
  console.log("================================================================================");
  console.log(`Supabase URL: ${SUPABASE_URL}\n`);

  // Target UUIDs previously provisioned on live database
  const emailA = "test-lodge-a@example.com";
  const emailB = "test-lodge-b@example.com";
  const password = "Password123!Secure";

  // 1. Authenticate as Lodge A using public anon client to get real JWT
  console.log("--------------------------------------------------------------------------------");
  console.log("STEP 1: Authenticate as Lodge A User via public anon client");
  console.log("--------------------------------------------------------------------------------");
  const clientA = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authA, error: errAuthA } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: password,
  });

  if (errAuthA || !authA.session) {
    throw new Error(`Failed to sign in as Lodge A: ${errAuthA?.message}`);
  }

  const userAId = authA.session.user.id;
  console.log(`✅ Authenticated successfully via PostgREST Auth endpoint.`);
  console.log(`   - User A ID (sub):       ${userAId}`);
  console.log(`   - User A Email:          ${authA.session.user.email}`);
  console.log(`   - User A Role:           ${authA.session.user.role}`);
  console.log(`   - Access Token (JWT snippet): ${authA.session.access_token.substring(0, 35)}...`);

  // 2. Authenticate as Lodge B using public anon client to get real JWT & verify their IDs
  console.log("\n--------------------------------------------------------------------------------");
  console.log("STEP 2: Authenticate as Lodge B User via public anon client");
  console.log("--------------------------------------------------------------------------------");
  const clientB = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authB, error: errAuthB } = await clientB.auth.signInWithPassword({
    email: emailB,
    password: password,
  });

  if (errAuthB || !authB.session) {
    throw new Error(`Failed to sign in as Lodge B: ${errAuthB?.message}`);
  }

  const userBId = authB.session.user.id;
  console.log(`✅ Authenticated successfully via PostgREST Auth endpoint.`);
  console.log(`   - User B ID (sub):       ${userBId}`);
  console.log(`   - User B Email:          ${authB.session.user.email}`);
  console.log(`   - User B Role:           ${authB.session.user.role}`);
  console.log(`   - Access Token (JWT snippet): ${authB.session.access_token.substring(0, 35)}...`);

  // Get Lodge B's own ID directly as authenticated Lodge B
  const { data: lodgeBRecords, error: errLodgeB } = await clientB.from("lodges").select("*");
  if (errLodgeB || !lodgeBRecords || lodgeBRecords.length === 0) {
    throw new Error(`Lodge B could not read its own record: ${errLodgeB?.message}`);
  }
  const lodgeB = lodgeBRecords[0];
  const lodgeBId = lodgeB.id;
  console.log(`\nLodge B Real Record retrieved by Lodge B:`);
  console.log(JSON.stringify(lodgeB, null, 2));

  // Get Lodge A's own ID directly as authenticated Lodge A
  const { data: lodgeARecords, error: errLodgeA } = await clientA.from("lodges").select("*");
  if (errLodgeA || !lodgeARecords || lodgeARecords.length === 0) {
    throw new Error(`Lodge A could not read its own record: ${errLodgeA?.message}`);
  }
  const lodgeA = lodgeARecords[0];
  const lodgeAId = lodgeA.id;
  console.log(`\nLodge A Real Record retrieved by Lodge A:`);
  console.log(JSON.stringify(lodgeA, null, 2));

  // 3. EXECUTE CROSS-TENANT ISOLATION QUERIES AS LODGE A
  console.log("\n================================================================================");
  console.log("STEP 3: RUN ISOLATION QUERIES AS AUTHENTICATED LODGE A (AGAINST LODGE B)");
  console.log("================================================================================");

  // 3.1: .from('lodges').select('*')
  console.log("\n--- Query 3.1: clientA.from('lodges').select('*') ---");
  const query1 = await clientA.from("lodges").select("*");
  console.log("HTTP Status:", query1.status, query1.statusText);
  console.log("Raw Response Data:\n", JSON.stringify(query1.data, null, 2));
  console.log("Error:\n", query1.error);
  const q1Pass = Array.isArray(query1.data) && query1.data.length === 1 && query1.data[0].id === lodgeAId;
  console.log(`Verdict: ${q1Pass ? "✅ PASS: Only Lodge A returned (1 row)" : "❌ FAIL"}`);

  // 3.2: .from('lodges').select('*').eq('id', lodgeB.id)
  console.log(`\n--- Query 3.2: clientA.from('lodges').select('*').eq('id', '${lodgeBId}') ---`);
  const query2 = await clientA.from("lodges").select("*").eq("id", lodgeBId);
  console.log("HTTP Status:", query2.status, query2.statusText);
  console.log("Raw Response Data:\n", JSON.stringify(query2.data, null, 2));
  console.log("Error:\n", query2.error);
  const q2Pass = Array.isArray(query2.data) && query2.data.length === 0;
  console.log(`Verdict: ${q2Pass ? "✅ PASS: 0 rows returned (RLS filtered out Lodge B)" : "❌ FAIL: Data leak"}`);

  // 3.3: .from('profiles').select('*').eq('lodge_id', lodgeB.id)
  console.log(`\n--- Query 3.3: clientA.from('profiles').select('*').eq('lodge_id', '${lodgeBId}') ---`);
  const query3 = await clientA.from("profiles").select("*").eq("lodge_id", lodgeBId);
  console.log("HTTP Status:", query3.status, query3.statusText);
  console.log("Raw Response Data:\n", JSON.stringify(query3.data, null, 2));
  console.log("Error:\n", query3.error);
  const q3Pass = Array.isArray(query3.data) && query3.data.length === 0;
  console.log(`Verdict: ${q3Pass ? "✅ PASS: 0 rows returned (RLS filtered out Lodge B profiles)" : "❌ FAIL: Data leak"}`);

  // 3.4: .from('lodges').update({name: 'Hacked'}).eq('id', lodgeB.id)
  console.log(`\n--- Query 3.4: clientA.from('lodges').update({ name: 'Hacked by Lodge A' }).eq('id', '${lodgeBId}').select() ---`);
  const query4 = await clientA.from("lodges").update({ name: "Hacked by Lodge A" }).eq("id", lodgeBId).select();
  console.log("HTTP Status:", query4.status, query4.statusText);
  console.log("Raw Response Data:\n", JSON.stringify(query4.data, null, 2));
  console.log("Error:\n", query4.error);
  const q4Pass = Array.isArray(query4.data) && query4.data.length === 0;
  console.log(`Verdict: ${q4Pass ? "✅ PASS: 0 rows affected (RLS denied update on Lodge B)" : "❌ FAIL: Mutation succeeded"}`);

  // Double check Lodge B name in database is unchanged
  const queryVerifyB = await clientB.from("lodges").select("id, name").eq("id", lodgeBId);
  console.log("\nVerification from Lodge B session (name remains un-hacked):", JSON.stringify(queryVerifyB.data, null, 2));

  console.log("\n================================================================================");
  console.log("                         ISOLATION VERIFICATION SUMMARY                         ");
  console.log("================================================================================");
  console.log(`User A (Auth UUID):      ${userAId}`);
  console.log(`Lodge A (Postgres UUID):  ${lodgeAId}`);
  console.log(`User B (Auth UUID):      ${userBId}`);
  console.log(`Lodge B (Postgres UUID):  ${lodgeBId}`);
  console.log(`\nTest 3.1 (SELECT * FROM lodges):           ${q1Pass ? "PASSED" : "FAILED"}`);
  console.log(`Test 3.2 (SELECT WHERE id = Lodge B ID):   ${q2Pass ? "PASSED" : "FAILED"}`);
  console.log(`Test 3.3 (SELECT profiles WHERE lodge_id): ${q3Pass ? "PASSED" : "FAILED"}`);
  console.log(`Test 3.4 (UPDATE Lodge B WHERE id):        ${q4Pass ? "PASSED" : "FAILED"}`);
  console.log("================================================================================");

  // Manual cleanup SQL (not executed automatically)
  console.log("\n--------------------------------------------------------------------------------");
  console.log("EXACT MANUAL CLEANUP SQL (Do not run automatically — for user review):");
  console.log("--------------------------------------------------------------------------------");
  console.log(`-- Run this in Supabase Dashboard SQL Editor when you wish to remove the test records:
BEGIN;

DELETE FROM public.profiles WHERE id IN ('${userAId}', '${userBId}');
DELETE FROM public.lodges WHERE id IN ('${lodgeAId}', '${lodgeBId}');
DELETE FROM auth.users WHERE id IN ('${userAId}', '${userBId}');

COMMIT;
`);
  console.log("--------------------------------------------------------------------------------");
}

runLivePostgrestTest().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
