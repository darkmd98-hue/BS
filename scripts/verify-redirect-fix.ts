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
  urlPath: string,
  cookieHeader = ""
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: urlPath,
        method: "GET",
        headers: {
          Host: `${hostname}:3000`,
          Cookie: cookieHeader,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, headers: res.headers, body }));
      }
    );
    req.on("error", (e) => resolve({ status: 0, headers: {}, body: e.message }));
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
  console.log("               TESTING REDIRECT LOOP FIXES (RAW NETWORK OUTPUT)                 ");
  console.log("================================================================================\n");

  // Sign in as Lodge A Admin (Pinecrest Alpine Resort)
  const pinecrestCookie = await signIn("test-lodge-a@example.com", "Password123!");

  // CASE 1: http://localhost:3000/admin (no subdomain, logged in as Lodge A Admin)
  console.log("CASE 1: GET http://localhost:3000/admin (Authenticated as Lodge A Admin)");
  const res1 = await testRequest("localhost", "/admin", pinecrestCookie);
  console.log(`HTTP Status:   ${res1.status}`);
  console.log(`Location:      ${res1.headers.location}`);
  console.log(`Expected:      Redirect to pinecrest.localhost:3000/admin (No loop)`);
  console.log(`Result:        ${res1.status === 307 || res1.status === 308 || res1.status === 302 ? "✅ PASS" : "❌ FAIL"}\n`);

  // Follow the redirect to confirm landing page
  if (res1.headers.location) {
    const target = new URL(res1.headers.location);
    const landingRes = await testRequest(target.hostname, target.pathname, pinecrestCookie);
    console.log(`Following redirect -> GET http://${target.hostname}:3000${target.pathname}`);
    console.log(`Landing Status: ${landingRes.status}`);
    console.log(`Contains Lodge Name: ${landingRes.body.includes("Pinecrest Alpine Resort")}`);
    console.log(`Landing Result: ${landingRes.status === 200 ? "✅ PASS" : "❌ FAIL"}\n`);
  }

  // CASE 2: http://localhost:3000/login (no subdomain, logged in as Lodge A Admin)
  console.log("CASE 2: GET http://localhost:3000/login (Authenticated as Lodge A Admin)");
  const res2 = await testRequest("localhost", "/login", pinecrestCookie);
  console.log(`HTTP Status:   ${res2.status}`);
  console.log(`Location:      ${res2.headers.location}`);
  console.log(`Expected:      Redirect to pinecrest.localhost:3000/admin (Sensible redirect, no loop)`);
  console.log(`Result:        ${res2.status === 307 || res2.status === 308 || res2.status === 302 ? "✅ PASS" : "❌ FAIL"}\n`);

  // CASE 3: http://localhost:3000/admin while logged out
  console.log("CASE 3: GET http://localhost:3000/admin (Logged Out / Anonymous)");
  const res3 = await testRequest("localhost", "/admin", "");
  console.log(`HTTP Status:   ${res3.status}`);
  console.log(`Location:      ${res3.headers.location}`);
  console.log(`Expected:      Redirect to /login?redirectTo=%2Fadmin (Clean login redirect, no loop)`);
  console.log(`Result:        ${res3.headers.location?.includes("/login") ? "✅ PASS" : "❌ FAIL"}\n`);

  // CASE 4: Re-check global route bypass for /register and /install
  console.log("CASE 4: GET http://localhost:3000/register & /install (Global routes)");
  const resReg = await testRequest("localhost", "/register", "");
  const resInst = await testRequest("localhost", "/install", "");
  console.log(`/register HTTP Status: ${resReg.status} (Expected: 200) -> ${resReg.status === 200 ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`/install  HTTP Status: ${resInst.status} (Expected: 200) -> ${resInst.status === 200 ? "✅ PASS" : "❌ FAIL"}\n`);

  // CASE 5: Re-check cross-tenant 403 fix (Lodge A accessing lakeside.localhost:3000/reception)
  console.log("CASE 5: Re-check Cross-Tenant 403 (Lodge A -> lakeside.localhost:3000/reception)");
  const resCross = await testRequest("lakeside.localhost", "/reception", pinecrestCookie);
  console.log(`HTTP Status:   ${resCross.status}`);
  console.log(`Expected:      403 Forbidden`);
  console.log(`Result:        ${resCross.status === 403 ? "✅ PASS" : "❌ FAIL"}\n`);

  console.log("================================================================================");
  const allPassed =
    (res1.status === 307 || res1.status === 308 || res1.status === 302) &&
    res1.headers.location?.includes("pinecrest.localhost") &&
    (res2.status === 307 || res2.status === 308 || res2.status === 302) &&
    res2.headers.location?.includes("pinecrest.localhost") &&
    res3.headers.location?.includes("/login") &&
    resReg.status === 200 &&
    resInst.status === 200 &&
    resCross.status === 403;

  if (allPassed) {
    console.log("🎉 ALL REDIRECT & TENANT ISOLATION CHECKS PASSED WITH 0 REGRESSIONS!");
  } else {
    console.error("❌ CHECKS FAILED!");
    process.exit(1);
  }
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

