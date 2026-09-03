import http from "http";
import fs from "fs";
import path from "path";
import { registerLodgeAction } from "../src/app/actions/auth";
import { createServerClient } from "@supabase/ssr";
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
    process.env[key] = val;
  }
});

function testRequest(
  hostname: string,
  urlPath: string,
  cookieHeader: string
): Promise<{ status: number; body: string; location?: string }> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: urlPath,
        method: "GET",
        headers: { Host: `${hostname}:3000`, Cookie: cookieHeader },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({ status: res.statusCode || 0, body, location: res.headers.location as string })
        );
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.end();
  });
}

async function signIn(email: string, password: string): Promise<string> {
  const cookies: Record<string, string> = {};
  const client = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        setAll: (toSet) => toSet.forEach((c) => (cookies[c.name] = c.value)),
      },
    }
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`);
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function main() {
  console.log("================================================================================");
  console.log("       STEP 4: LIVE END-TO-END REGISTRATION & SUBDOMAIN DASHBOARD ACCESS        ");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const testEmail = `owner-${timestamp}@valleyretreat.com`;
  const testPassword = "Password123!";
  const testLodgeName = `Valley Retreat ${timestamp.toString().slice(-4)}`;
  const testSubdomain = `valley${timestamp.toString().slice(-4)}`;
  const testOwner = "Aarav Sharma";

  console.log("1. Submitting new lodge registration via Server Action registerLodgeAction():");
  console.log(`   - Lodge:     ${testLodgeName}`);
  console.log(`   - Subdomain: ${testSubdomain}`);
  console.log(`   - Email:     ${testEmail}`);
  console.log(`   - Owner:     ${testOwner}\n`);

  const regResult = await registerLodgeAction({
    lodgeName: testLodgeName,
    subdomain: testSubdomain,
    address: "74 Valley High Road, Manali",
    roomCount: 15,
    fullName: testOwner,
    email: testEmail,
    password: testPassword,
  });

  console.log("Registration Raw Output Result:");
  console.log(JSON.stringify(regResult, null, 2));

  if (!regResult.success) {
    console.error("❌ Registration failed!");
    process.exit(1);
  }

  console.log("\n2. Querying Supabase directly to verify persisted record in `lodges`:");
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: lodgeRow, error: lodgeErr } = await adminClient
    .from("lodges")
    .select("id, name, subdomain, address, owner_user_id, created_at")
    .eq("id", regResult.lodgeId)
    .single();

  console.log("Persisted Lodge Record:");
  console.log(JSON.stringify(lodgeRow, null, 2));

  if (lodgeErr || !lodgeRow || lodgeRow.subdomain !== testSubdomain) {
    console.error("❌ Subdomain mismatch in database!");
    process.exit(1);
  }

  console.log("\n3. Authenticating with new owner credentials via Supabase Auth:");
  const cookieHeader = await signIn(testEmail, testPassword);
  console.log("✅ Received valid session JWT cookie.");

  console.log("\n4. Accessing the new lodge's subdomain reception dashboard:");
  const targetHost = `${testSubdomain}.localhost`;
  console.log(`   GET http://${targetHost}:3000/reception`);
  const dashRes = await testRequest(targetHost, "/reception", cookieHeader);
  console.log(`   HTTP Status Code: ${dashRes.status}`);
  const containsLodgeName = dashRes.body.includes(testLodgeName);
  console.log(`   Renders newly registered lodge name in HTML: ${containsLodgeName}`);

  console.log("\n5. Accessing the new lodge's subdomain admin rooms dashboard:");
  console.log(`   GET http://${targetHost}:3000/admin/rooms`);
  const adminRes = await testRequest(targetHost, "/admin/rooms", cookieHeader);
  console.log(`   HTTP Status Code: ${adminRes.status}`);

  console.log("\n6. Cross-Tenant Guard Check: Trying to access pinecrest with this new session:");
  const crossApiRes = await testRequest("pinecrest.localhost", "/api/tenant-test", cookieHeader);
  console.log(`   GET http://pinecrest.localhost:3000/api/tenant-test with Valley Retreat session:`);
  console.log(`   HTTP Status Code: ${crossApiRes.status} (Expected: 403 Forbidden)`);

  const crossReceptionRes = await testRequest("pinecrest.localhost", "/reception", cookieHeader);
  console.log(`   GET http://pinecrest.localhost:3000/reception with Valley Retreat session:`);
  console.log(`   HTTP Status Code: ${crossReceptionRes.status} (Expected: 403 Forbidden)`);

  const crossAdminRes = await testRequest("pinecrest.localhost", "/admin/rooms", cookieHeader);
  console.log(`   GET http://pinecrest.localhost:3000/admin/rooms with Valley Retreat session:`);
  console.log(`   HTTP Status Code: ${crossAdminRes.status} (Expected: 403 Forbidden)`);

  const passed =
    regResult.success &&
    lodgeRow.subdomain === testSubdomain &&
    dashRes.status === 200 &&
    containsLodgeName &&
    adminRes.status === 200 &&
    crossApiRes.status === 403 &&
    crossReceptionRes.status === 403 &&
    crossAdminRes.status === 403;



  console.log("\n================================================================================");
  if (passed) {
    console.log("🎉 END-TO-END REGISTRATION & SUBDOMAIN ROUTING FULLY VERIFIED ON PRODUCTION BUILD!");
  } else {
    console.error("❌ VERIFICATION CHECKS FAILED!");
    process.exit(1);
  }
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
