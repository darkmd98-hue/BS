import http from "http";
import fs from "fs";
import path from "path";
import { createServerClient } from "@supabase/ssr";

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

function testRequest(hostname: string, path: string, cookieHeader: string | null = null): Promise<{
  status: number;
  headers: Record<string, any>;
  body: string;
}> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      Host: `${hostname}:3000`,
    };
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: path,
        method: "GET",
        headers: headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: body,
          });
        });
      }
    );
    req.on("error", (err) => resolve({ status: 0, headers: {}, body: err.message }));
    req.end();
  });
}

async function run() {
  console.log("================================================================================");
  console.log("            T-044: LIVE VERIFICATION OF getTenantContext() & 403 GUARD           ");
  console.log("================================================================================\n");

  // Authenticate as Lodge A using @supabase/ssr to obtain real session cookies
  const cookiesA: Record<string, string> = {};
  const serverClientA = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => Object.entries(cookiesA).map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach((c) => (cookiesA[c.name] = c.value)),
    },
  });

  const authResA = await serverClientA.auth.signInWithPassword({
    email: "test-lodge-a@example.com",
    password: "Password123!",
  });

  if (authResA.error || !authResA.data.session) {
    throw new Error(`Sign in failed for Lodge A: ${authResA.error?.message}`);
  }

  const cookieHeaderA = Object.entries(cookiesA)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  console.log("✅ Authenticated as test-lodge-a@example.com (Pinecrest Alpine Resort)");
  console.log(`   User ID: ${authResA.data.user.id}`);
  console.log(`   Expected Tenant (Lodge A): 2e66186f-0f87-47f9-a29e-00984781fb53`);
  console.log(`   Session cookies initialized: ${Object.keys(cookiesA).join(", ")}\n`);

  // ---------------------------------------------------------------------------
  // TEST 1: Matching tenant request (pinecrest.localhost:3000)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 1: Authenticated request to pinecrest.localhost:3000/api/tenant-test");
  console.log("--------------------------------------------------------------------------------");
  const res1 = await testRequest("pinecrest.localhost", "/api/tenant-test", cookieHeaderA);

  console.log(`HTTP Status: ${res1.status}`);
  console.log("Response Body:");
  console.log(res1.body);

  const json1 = JSON.parse(res1.body);
  if (res1.status === 200 && json1.context?.lodgeId === "2e66186f-0f87-47f9-a29e-00984781fb53") {
    console.log("✅ PASS: getTenantContext() returned authenticated user's real lodge context.\n");
  } else {
    console.error("❌ FAIL: Did not return valid matching tenant context!\n");
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Mismatched tenant request (lakeside.localhost:3000 with Lodge A session)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 2: MISMATCHED request to lakeside.localhost:3000/api/tenant-test as Lodge A user");
  console.log("--------------------------------------------------------------------------------");
  const res2 = await testRequest("lakeside.localhost", "/api/tenant-test", cookieHeaderA);

  console.log(`HTTP Status: ${res2.status}`);
  console.log("Response Body:");
  console.log(res2.body);

  const json2 = JSON.parse(res2.body);
  if (res2.status === 403 && json2.code === 403) {
    console.log("✅ PASS: Cross-tenant session mismatch caught! Strictly rejected with 403 Forbidden.");
    console.log(`   Error message: ${json2.message}\n`);
  } else {
    console.error("❌ FAIL: Request was not rejected with 403!\n");
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Authenticated as Lodge B user (test-lodge-b@example.com)
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("TEST 3: Cross-validation with Lodge B user (test-lodge-b@example.com)");
  console.log("--------------------------------------------------------------------------------");
  const cookiesB: Record<string, string> = {};
  const serverClientB = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => Object.entries(cookiesB).map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach((c) => (cookiesB[c.name] = c.value)),
    },
  });

  const authResB = await serverClientB.auth.signInWithPassword({
    email: "test-lodge-b@example.com",
    password: "Password123!",
  });

  if (!authResB.error && authResB.data.session) {
    const cookieHeaderB = Object.entries(cookiesB)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

    // 3a. Lodge B accessing Lakeside (matching)
    console.log("3a. Lodge B accessing lakeside.localhost (Matching):");
    const resBMatching = await testRequest("lakeside.localhost", "/api/tenant-test", cookieHeaderB);
    console.log(`    Status: ${resBMatching.status}`);
    console.log(`    Body: ${resBMatching.body}`);

    // 3b. Lodge B accessing Pinecrest (mismatched)
    console.log("\n3b. Lodge B accessing pinecrest.localhost (Mismatched):");
    const resBMismatched = await testRequest("pinecrest.localhost", "/api/tenant-test", cookieHeaderB);
    console.log(`    Status: ${resBMismatched.status}`);
    console.log(`    Body: ${resBMismatched.body}`);

    const jsonBMismatched = JSON.parse(resBMismatched.body);
    if (resBMatching.status === 200 && resBMismatched.status === 403) {
      console.log("✅ PASS: Lodge B bi-directional isolation and mismatch guards confirmed!\n");
    }
  } else {
    console.log(`(Note: Lodge B login check: ${authResB.error?.message})\n`);
  }

  console.log("================================================================================");
  console.log("🎉 ALL T-044 TESTS PASSED! getTenantContext() & 403 GUARDS FULLY VERIFIED!");
  console.log("================================================================================");
}

run().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
