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
  path: string,
  cookieHeader: string
): Promise<{
  status: number;
  headers: Record<string, any>;
  body: string;
}> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      Host: `${hostname}:3000`,
      Cookie: cookieHeader,
    };

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

async function main() {
  console.log("================================================================================");
  console.log("        T-061 LIVE VERIFICATION: REPORTS & ANALYTICS DUAL-LODGE ISOLATION       ");
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

  console.log("1. Checking /admin/reports under Pinecrest (Lodge A)...");
  const resA = await testRequest("pinecrest.localhost", "/admin/reports", cookieHeaderA);
  const aValid =
    resA.status === 200 &&
    resA.body.includes("Pinecrest Alpine Resort") &&
    resA.body.includes("Reports &amp; Financial Analytics") &&
    !resA.body.includes("Lakeside Haven Inn");
  console.log(`   - Status: HTTP ${resA.status}`);
  console.log(`   - Pinecrest Branding & Isolation: ${aValid ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n2. Checking /admin/reports under Lakeside (Lodge B)...");
  const resB = await testRequest("lakeside.localhost", "/admin/reports", cookieHeaderB);
  const bValid =
    resB.status === 200 &&
    resB.body.includes("Lakeside Haven Inn") &&
    resB.body.includes("Reports &amp; Financial Analytics") &&
    !resB.body.includes("Pinecrest Alpine Resort");
  console.log(`   - Status: HTTP ${resB.status}`);
  console.log(`   - Lakeside Branding & Isolation: ${bValid ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n3. Cross-Tenant Session Mismatch Guard Check...");
  const resCross = await testRequest("lakeside.localhost", "/admin/reports", cookieHeaderA);
  const crossValid = resCross.status === 403;
  console.log(`   - Lodge A accessing Lakeside Reports: HTTP ${resCross.status} (Expected: 403 Forbidden) -> ${crossValid ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n4. Unauthenticated Access Guard Check...");
  const resAnon = await testRequest("pinecrest.localhost", "/admin/reports", "");
  const anonValid = resAnon.status === 307;
  console.log(`   - Anonymous request to Reports: HTTP ${resAnon.status} (Expected: 307 Redirect) -> ${anonValid ? "✅ PASS" : "❌ FAIL"}`);

  if (!aValid || !bValid || !crossValid || !anonValid) {
    console.error("\n❌ Some T-061 verification checks failed!");
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("🎉 ALL T-061 REPORTS & ANALYTICS CHECKS PASSED!");
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
