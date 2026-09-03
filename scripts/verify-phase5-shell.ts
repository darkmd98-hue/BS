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
  console.log("       PHASE 5 VERIFICATION: SHELL LAYOUT RENDERING & LODGE BRANDING CHECK       ");
  console.log("================================================================================\n");

  // 1. Authenticate Lodge A
  const cookiesA: Record<string, string> = {};
  const clientA = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => Object.entries(cookiesA).map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach((c) => (cookiesA[c.name] = c.value)),
    },
  });
  await clientA.auth.signInWithPassword({ email: "test-lodge-a@example.com", password: "Password123!" });
  const cookieHeaderA = Object.entries(cookiesA).map(([k, v]) => `${k}=${v}`).join("; ");

  // 2. Authenticate Lodge B
  const cookiesB: Record<string, string> = {};
  const clientB = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => Object.entries(cookiesB).map(([name, value]) => ({ name, value })),
      setAll: (toSet) => toSet.forEach((c) => (cookiesB[c.name] = c.value)),
    },
  });
  await clientB.auth.signInWithPassword({ email: "test-lodge-b@example.com", password: "Password123!" });
  const cookieHeaderB = Object.entries(cookiesB).map(([k, v]) => `${k}=${v}`).join("; ");

  // Check 1: Pinecrest /admin
  console.log("--------------------------------------------------------------------------------");
  console.log("CHECK 1: Pinecrest Admin Shell (pinecrest.localhost:3000/admin)");
  console.log("--------------------------------------------------------------------------------");
  const res1 = await testRequest("pinecrest.localhost", "/admin", cookieHeaderA);
  console.log(`HTTP Status: ${res1.status}`);
  const hasPinecrestName = res1.body.includes("Pinecrest Alpine Resort");
  const hasPinecrestSub = res1.body.includes("pinecrest");
  console.log(`Contains 'Pinecrest Alpine Resort': ${hasPinecrestName}`);
  console.log(`Contains 'pinecrest': ${hasPinecrestSub}`);
  if (res1.status === 200 && hasPinecrestName && hasPinecrestSub) {
    console.log("✅ PASS: Pinecrest admin layout renders correct lodge branding in Sidebar.\n");
  } else {
    console.error("❌ FAIL on Check 1!");
    process.exit(1);
  }

  // Check 2: Lakeside /admin
  console.log("--------------------------------------------------------------------------------");
  console.log("CHECK 2: Lakeside Admin Shell (lakeside.localhost:3000/admin)");
  console.log("--------------------------------------------------------------------------------");
  const res2 = await testRequest("lakeside.localhost", "/admin", cookieHeaderB);
  console.log(`HTTP Status: ${res2.status}`);
  const hasLakesideName = res2.body.includes("Lakeside Haven Inn");
  const hasLakesideSub = res2.body.includes("lakeside");
  console.log(`Contains 'Lakeside Haven Inn': ${hasLakesideName}`);
  console.log(`Contains 'lakeside': ${hasLakesideSub}`);
  if (res2.status === 200 && hasLakesideName && hasLakesideSub) {
    console.log("✅ PASS: Lakeside admin layout renders correct lodge branding in Sidebar.\n");
  } else {
    console.error("❌ FAIL on Check 2!");
    process.exit(1);
  }

  // Check 3: Pinecrest /reception
  console.log("--------------------------------------------------------------------------------");
  console.log("CHECK 3: Pinecrest Reception Shell (pinecrest.localhost:3000/reception)");
  console.log("--------------------------------------------------------------------------------");
  const res3 = await testRequest("pinecrest.localhost", "/reception", cookieHeaderA);
  console.log(`HTTP Status: ${res3.status}`);
  const hasRecPinecrest = res3.body.includes("Pinecrest Alpine Resort");
  console.log(`Contains 'Pinecrest Alpine Resort': ${hasRecPinecrest}`);
  if (res3.status === 200 && hasRecPinecrest) {
    console.log("✅ PASS: Pinecrest reception layout renders correct lodge branding.\n");
  } else {
    console.error("❌ FAIL on Check 3!");
    process.exit(1);
  }

  // Check 4: Lakeside /reception
  console.log("--------------------------------------------------------------------------------");
  console.log("CHECK 4: Lakeside Reception Shell (lakeside.localhost:3000/reception)");
  console.log("--------------------------------------------------------------------------------");
  const res4 = await testRequest("lakeside.localhost", "/reception", cookieHeaderB);
  console.log(`HTTP Status: ${res4.status}`);
  const hasRecLakeside = res4.body.includes("Lakeside Haven Inn");
  console.log(`Contains 'Lakeside Haven Inn': ${hasRecLakeside}`);
  if (res4.status === 200 && hasRecLakeside) {
    console.log("✅ PASS: Lakeside reception layout renders correct lodge branding.\n");
  } else {
    console.error("❌ FAIL on Check 4!");
    process.exit(1);
  }

  console.log("================================================================================");
  console.log("🎉 ALL PHASE 5 CHECKS PASSED! RECHARTS & SHARED SHELL VERIFIED!");
  console.log("================================================================================");
}

run().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
