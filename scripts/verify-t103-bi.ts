/**
 * T-103 Advanced Reporting & BI — Dual-Lodge Live Verification
 * Requires: `npx next start -p 3000` running in background
 */
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

function testRequest(
  hostname: string,
  reqPath: string,
  cookieHeader: string
): Promise<{ status: number; headers: Record<string, any>; body: string }> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      Host: `${hostname}:3000`,
      Cookie: cookieHeader,
    };

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
  console.log("     T-103 LIVE VERIFICATION: ADVANCED REPORTING, BI & P&L STATEMENT            ");
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

  console.log("✅ Both lodge admin sessions authenticated\n");

  const results: boolean[] = [];
  await delay(1000);

  // Check 1: Pinecrest BI & P&L
  console.log("1. Checking /admin/bi under Pinecrest (Lodge A)...");
  let resA = await testRequest("pinecrest.localhost", "/admin/bi", cookieHeaderA);
  if (resA.status !== 200) {
    await delay(600);
    resA = await testRequest("pinecrest.localhost", "/admin/bi", cookieHeaderA);
  }
  const hasBiTitleA = resA.body.includes("Financial Analytics") || resA.body.includes("Advanced BI");
  const hasRevparA = resA.body.includes("RevPAR");
  const hasPnlA = resA.body.includes("P&amp;L") || resA.body.includes("P&L") || resA.body.includes("Net Operating Income");
  const pass1 = resA.status === 200 && hasBiTitleA && hasRevparA && hasPnlA;
  console.log(`   - Status: HTTP ${resA.status} (BI Title: ${hasBiTitleA}, RevPAR: ${hasRevparA}, P&L: ${hasPnlA}) -> ${pass1 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass1);
  await delay(500);

  // Check 2: Lakeside BI & P&L
  console.log("\n2. Checking /admin/bi under Lakeside (Lodge B)...");
  let resB = await testRequest("lakeside.localhost", "/admin/bi", cookieHeaderB);
  if (resB.status !== 200) {
    await delay(1000);
    resB = await testRequest("lakeside.localhost", "/admin/bi", cookieHeaderB);
  }
  const hasBiTitleB = resB.body.includes("Financial Analytics") || resB.body.includes("Advanced BI");
  const hasRevparB = resB.body.includes("RevPAR");
  const pass2 = resB.status === 200 && hasBiTitleB && hasRevparB;
  console.log(`   - Status: HTTP ${resB.status} (BI Title: ${hasBiTitleB}, RevPAR: ${hasRevparB}) -> ${pass2 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass2);
  await delay(500);

  // Check 3: Cross-Tenant Session Mismatch Guard
  console.log("\n3. Cross-Tenant Session Mismatch Guard Check (Lodge A cookie on Lakeside subdomain)...");
  const resCross = await testRequest("lakeside.localhost", "/admin/bi", cookieHeaderA);
  const pass3 = resCross.status === 403;
  console.log(`   - Status: HTTP ${resCross.status} (Expected: 403 Forbidden) -> ${pass3 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass3);
  await delay(500);

  // Check 4: Anonymous Access Guard
  console.log("\n4. Anonymous Access Guard Check...");
  const resAnon = await testRequest("pinecrest.localhost", "/admin/bi", "");
  const pass4 = resAnon.status === 307;
  console.log(`   - Status: HTTP ${resAnon.status} (Expected: 307 Redirect) -> ${pass4 ? "✅ PASS" : "❌ FAIL"}`);
  results.push(pass4);

  const passed = results.filter(Boolean).length;
  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed}/${results.length} PASSED`);
  if (passed < results.length) {
    console.error("❌ Some T-103 verification checks failed!");
    process.exit(1);
  }
  console.log("🎉 ALL T-103 ADVANCED BI & P&L CHECKS PASSED!");
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
