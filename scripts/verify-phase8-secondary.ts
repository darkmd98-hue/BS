import http from "http";
import fs from "fs";
import path from "path";
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
  console.log("         PHASE 8 LIVE VERIFICATION: CUSTOMER PROFILE & PRINT INVOICE            ");
  console.log("================================================================================\n");

  // Auth
  const cookieHeaderA = await signIn("test-lodge-a@example.com", "Password123!");
  const cookieHeaderB = await signIn("test-lodge-b@example.com", "Password123!");
  console.log("✅ Authenticated both test lodge accounts.\n");

  // Get Lodge A + Lodge B first customers and bills from Supabase admin client
  const adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: lodges } = await adminClient
    .from("lodges")
    .select("id, name, subdomain")
    .in("subdomain", ["pinecrest", "lakeside"]);

  const lodgeA = (lodges as any[]).find((l: any) => l.subdomain === "pinecrest");
  const lodgeB = (lodges as any[]).find((l: any) => l.subdomain === "lakeside");

  // Fetch 1st customer from each lodge
  const { data: custA } = await adminClient
    .from("customers")
    .select("id, name")
    .eq("lodge_id", lodgeA.id)
    .limit(1)
    .single();

  const { data: custB } = await adminClient
    .from("customers")
    .select("id, name")
    .eq("lodge_id", lodgeB.id)
    .limit(1)
    .single();

  // Fetch 1st bill from each lodge
  const { data: billA } = await adminClient
    .from("bills")
    .select("id")
    .eq("lodge_id", lodgeA.id)
    .limit(1)
    .single();

  const { data: billB } = await adminClient
    .from("bills")
    .select("id")
    .eq("lodge_id", lodgeB.id)
    .limit(1)
    .single();

  console.log(`Lodge A: ${lodgeA.name} (${lodgeA.subdomain})`);
  console.log(`  Customer: ${(custA as any).name} (ID: ${(custA as any).id})`);
  console.log(`  Bill:     ID ${(billA as any)?.id}\n`);
  console.log(`Lodge B: ${lodgeB.name} (${lodgeB.subdomain})`);
  console.log(`  Customer: ${(custB as any).name} (ID: ${(custB as any).id})`);
  console.log(`  Bill:     ID ${(billB as any)?.id}\n`);

  console.log("| Screen / Route | Pinecrest (Lodge A) | Lakeside (Lodge B) | Isolation Status |");
  console.log("| :--- | :---: | :---: | :---: |");

  // --- Test 1: Customer Profile as Lodge A ---
  const custAPath = `/reception/customers/${(custA as any).id}`;
  const resA1 = await testRequest("pinecrest.localhost", custAPath, cookieHeaderA);
  const a1Valid =
    resA1.status === 200 &&
    resA1.body.includes(lodgeA.name) &&
    !resA1.body.includes(lodgeB.name);
  console.log(
    `| Customer Profile (\`/reception/customers/[id]\`) | HTTP ${resA1.status} (Lodge A customer) | — | ${a1Valid ? "✅ PASS" : "❌ FAIL"} |`
  );

  // --- Test 2: Customer Profile as Lodge B ---
  const custBPath = `/reception/customers/${(custB as any).id}`;
  const resB1 = await testRequest("lakeside.localhost", custBPath, cookieHeaderB);
  const b1Valid =
    resB1.status === 200 &&
    resB1.body.includes(lodgeB.name) &&
    !resB1.body.includes(lodgeA.name);
  console.log(
    `| Customer Profile (\`/reception/customers/[id]\`) | — | HTTP ${resB1.status} (Lodge B customer) | ${b1Valid ? "✅ PASS" : "❌ FAIL"} |`
  );

  // --- Test 3: Print Invoice as Lodge A ---
  const billAPath = `/reception/billing/${(billA as any).id}/print`;
  const resA2 = await testRequest("pinecrest.localhost", billAPath, cookieHeaderA);
  const a2Valid =
    resA2.status === 200 &&
    resA2.body.includes(lodgeA.name) &&
    !resA2.body.includes(lodgeB.name);
  console.log(
    `| Print Invoice (\`/reception/billing/[billId]/print\`) | HTTP ${resA2.status} (Lodge A bill) | — | ${a2Valid ? "✅ PASS" : "❌ FAIL"} |`
  );

  // --- Test 4: Print Invoice as Lodge B ---
  const billBPath = `/reception/billing/${(billB as any).id}/print`;
  const resB2 = await testRequest("lakeside.localhost", billBPath, cookieHeaderB);
  const b2Valid =
    resB2.status === 200 &&
    resB2.body.includes(lodgeB.name) &&
    !resB2.body.includes(lodgeA.name);
  console.log(
    `| Print Invoice (\`/reception/billing/[billId]/print\`) | — | HTTP ${resB2.status} (Lodge B bill) | ${b2Valid ? "✅ PASS" : "❌ FAIL"} |`
  );

  // --- Cross-UUID Tests ---
  console.log("\n--------------------------------------------------------------------------------");
  console.log("DIRECT-UUID BOUNDARY CHECKS: Lodge A requesting Lodge B resources");
  console.log("--------------------------------------------------------------------------------");

  // Lodge A → Lodge B customer profile
  const crossCust = await testRequest("pinecrest.localhost", custBPath, cookieHeaderA);
  console.log(
    `Lodge A → Lodge B Customer Profile: HTTP ${crossCust.status} ${crossCust.status === 404 ? "✅ PASS (404)" : "❌ FAIL (expected 404, got " + crossCust.status + ")"}`
  );

  // Lodge A → Lodge B bill print
  const crossBill = await testRequest("pinecrest.localhost", billBPath, cookieHeaderA);
  console.log(
    `Lodge A → Lodge B Print Invoice:     HTTP ${crossBill.status} ${crossBill.status === 404 ? "✅ PASS (404)" : "❌ FAIL (expected 404, got " + crossBill.status + ")"}`
  );

  const allPassed =
    a1Valid &&
    b1Valid &&
    a2Valid &&
    b2Valid &&
    crossCust.status === 404 &&
    crossBill.status === 404;

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("🎉 ALL PHASE 8 SCREENS & ISOLATION BOUNDARIES VERIFIED IN PRODUCTION BUILD!");
  } else {
    console.error("❌ SOME CHECKS FAILED — review output above.");
    process.exit(1);
  }
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
