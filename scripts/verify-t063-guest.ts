/**
 * T-063 Guest Portal — Dual-Lodge Live Verification
 * Requires: `npx next start -p 3000` running in background
 */
import http from "http";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function testRequest(
  hostname: string,
  reqPath: string,
  cookieHeader = ""
): Promise<{ status: number; headers: Record<string, any>; body: string }> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      Host: `${hostname}:3000`,
    };
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: reqPath,
        method: "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, headers: res.headers, body });
        });
      }
    );
    req.on("error", (err) => resolve({ status: 0, headers: {}, body: err.message }));
    req.end();
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("================================================================================");
  console.log("        T-063 LIVE VERIFICATION: GUEST PORTAL DUAL-LODGE ISOLATION              ");
  console.log("================================================================================\n");

  // Look up Pinecrest & Lakeside lodge IDs and reservations
  const { data: lodges } = await admin.from("lodges").select("id, subdomain, name");
  const pinecrest = lodges?.find((l) => l.subdomain === "pinecrest");
  const lakeside = lodges?.find((l) => l.subdomain === "lakeside");

  if (!pinecrest || !lakeside) {
    throw new Error("Could not find test lodges in database");
  }

  const { data: resA } = await admin
    .from("reservations")
    .select("id")
    .eq("lodge_id", pinecrest.id)
    .limit(1)
    .single();

  const { data: resB } = await admin
    .from("reservations")
    .select("id")
    .eq("lodge_id", lakeside.id)
    .limit(1)
    .single();

  if (!resA || !resB) {
    throw new Error("Could not find sample reservations for Pinecrest and Lakeside");
  }

  console.log(`Pinecrest Lodge ID: ${pinecrest.id}, Sample Res ID: ${resA.id}`);
  console.log(`Lakeside Lodge ID:  ${lakeside.id}, Sample Res ID: ${resB.id}\n`);

  const results: boolean[] = [];

  // Check 1: Pinecrest Guest Login page
  console.log("1. Checking /guest/login under Pinecrest...");
  const loginA = await testRequest("pinecrest.localhost", "/guest/login");
  const pass1 = loginA.status === 200 && loginA.body.includes("Pinecrest Alpine Resort");
  console.log(`   - Status: HTTP ${loginA.status} (Branded: ${loginA.body.includes("Pinecrest")}) -> ${pass1 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass1);
  await delay(400);

  // Check 2: Lakeside Guest Login page
  console.log("\n2. Checking /guest/login under Lakeside...");
  const loginB = await testRequest("lakeside.localhost", "/guest/login");
  const pass2 = loginB.status === 200 && loginB.body.includes("Lakeside Haven Inn");
  console.log(`   - Status: HTTP ${loginB.status} (Branded: ${loginB.body.includes("Lakeside")}) -> ${pass2 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass2);
  await delay(400);

  // Check 3: Pinecrest Guest Portal
  console.log(`\n3. Checking /guest/${resA.id} under Pinecrest (own lodge)...`);
  const portalA = await testRequest("pinecrest.localhost", `/guest/${resA.id}`);
  const pass3 =
    portalA.status === 200 &&
    portalA.body.includes("Pinecrest Alpine Resort") &&
    portalA.body.includes("Your Stay") &&
    portalA.body.includes("Bill &amp; Folio");
  console.log(`   - Status: HTTP ${portalA.status} -> ${pass3 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass3);
  await delay(400);

  // Check 4: Lakeside Guest Portal
  console.log(`\n4. Checking /guest/${resB.id} under Lakeside (own lodge)...`);
  const portalB = await testRequest("lakeside.localhost", `/guest/${resB.id}`);
  const pass4 =
    portalB.status === 200 &&
    portalB.body.includes("Lakeside Haven Inn") &&
    portalB.body.includes("Your Stay") &&
    portalB.body.includes("Bill &amp; Folio");
  console.log(`   - Status: HTTP ${portalB.status} -> ${pass4 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass4);
  await delay(400);

  // Check 5: Cross-Tenant Isolation (Pinecrest trying to access Lakeside's reservation)
  console.log(`\n5. Cross-Tenant Guard: Pinecrest requesting Lakeside's reservation ${resB.id}...`);
  const crossA = await testRequest("pinecrest.localhost", `/guest/${resB.id}`);
  const pass5 = crossA.status === 404;
  console.log(`   - Status: HTTP ${crossA.status} (Expected: 404 Not Found) -> ${pass5 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass5);
  await delay(400);

  // Check 6: Cross-Tenant Isolation (Lakeside trying to access Pinecrest's reservation)
  console.log(`\n6. Cross-Tenant Guard: Lakeside requesting Pinecrest's reservation ${resA.id}...`);
  const crossB = await testRequest("lakeside.localhost", `/guest/${resA.id}`);
  const pass6 = crossB.status === 404;
  console.log(`   - Status: HTTP ${crossB.status} (Expected: 404 Not Found) -> ${pass6 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass6);
  await delay(400);

  // Check 7: Invalid Reservation ID
  console.log("\n7. Invalid Reservation ID Guard: 00000000-0000-0000-0000-000000000000...");
  const invalidRes = await testRequest("pinecrest.localhost", "/guest/00000000-0000-0000-0000-000000000000");
  const pass7 = invalidRes.status === 404;
  console.log(`   - Status: HTTP ${invalidRes.status} (Expected: 404 Not Found) -> ${pass7 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass7);

  const passed = results.filter(Boolean).length;
  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed}/${results.length} PASSED`);
  if (passed < results.length) {
    console.error("❌ Some T-063 verification checks failed!");
    process.exit(1);
  }
  console.log("🎉 ALL T-063 GUEST PORTAL CHECKS PASSED!");
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

