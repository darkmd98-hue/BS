import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";

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
  console.error("Missing env keys");
  process.exit(1);
}

const LODGE_A_ID = "2e66186f-0f87-47f9-a29e-00984781fb53";
const LODGE_B_ID = "e6c99f07-00f5-4cf5-b1f7-e0100b6f06c9";

const KNOWN_ROWS_B = {
  rooms: "1f28eb57-d21c-4a7a-872d-5e532cd69858",
  customers: "b988d66d-f187-4d4a-b332-54f52128575f",
  reservations: "4da63bfd-693d-4a66-9d28-b1869ac1eae0",
  bills: "8e1ba6d6-299f-4967-9100-f72b3782c995",
  payments: "46e234b7-07ad-4f26-a724-29e28959199d",
};

const TABLES = ["rooms", "customers", "reservations", "bills", "payments"] as const;

function httpsRequest(
  urlStr: string,
  options: { method: string; headers: Record<string, string>; body?: string },
  retries = 3
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: options.method,
      headers: options.headers,
      timeout: 25000,
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
    });

    req.on("timeout", () => {
      req.destroy();
      if (retries > 0) {
        console.log(`[Timeout on ${url.pathname}, retrying (${retries} left)...]`);
        setTimeout(() => {
          httpsRequest(urlStr, options, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(new Error(`Timeout connecting to ${urlStr}`));
      }
    });

    req.on("error", (err) => {
      if (retries > 0) {
        console.log(`[Error on ${url.pathname}: ${err.message}, retrying (${retries} left)...]`);
        setTimeout(() => {
          httpsRequest(urlStr, options, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(err);
      }
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runT042() {
  console.log("================================================================================");
  console.log("                T-042: POSTGREST RLS TENANT ISOLATION TEST                      ");
  console.log("================================================================================");
  console.log(`Target URL: ${SUPABASE_URL}`);
  console.log(`Lodge A ID: ${LODGE_A_ID} (Pinecrest)`);
  console.log(`Lodge B ID: ${LODGE_B_ID} (Lakeside)\n`);

  // Step 1: Sign in as test-lodge-a@example.com using public anon client
  const clientA = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
    email: "test-lodge-a@example.com",
    password: "Password123!",
  });

  if (errA || !authA.session) {
    throw new Error(`Auth failed for Lodge A: ${errA?.message}`);
  }

  const tokenA = authA.session.access_token;
  console.log(`✅ Authenticated as test-lodge-a@example.com`);
  console.log(`   User ID: ${authA.session.user.id}`);
  console.log(`   JWT: ${tokenA.substring(0, 30)}...\n`);

  let allPassed = true;

  for (const table of TABLES) {
    console.log("--------------------------------------------------------------------------------");
    console.log(`TESTING TABLE: ${table.toUpperCase()}`);
    console.log("--------------------------------------------------------------------------------");
    const targetBId = KNOWN_ROWS_B[table];

    // 1. SELECT *
    console.log(`[1] SELECT * FROM ${table} as Lodge A...`);
    const resSelectAll = await httpsRequest(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      method: "GET",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${tokenA}`,
        Accept: "application/json",
      },
    });

    const statusAll = resSelectAll.status;
    const bodyAll: any[] = JSON.parse(resSelectAll.body);

    console.log(`    Status: ${statusAll}`);
    console.log(`    Rows returned: ${bodyAll.length}`);

    // Verify all returned rows belong to Lodge A
    const leakedRows = bodyAll.filter((r) => r.lodge_id !== LODGE_A_ID);
    if (leakedRows.length > 0) {
      console.error(`    ❌ LEAK DETECTED! Found ${leakedRows.length} rows not belonging to Lodge A!`);
      console.error(JSON.stringify(leakedRows, null, 2));
      allPassed = false;
    } else {
      console.log(`    ✅ 0 cross-tenant rows leaked. All returned rows belong strictly to Lodge A.`);
      console.log(`    Returned Row IDs: ${bodyAll.map((r) => r.id).join(", ")}`);
    }

    // 2. SELECT WHERE id = targetBId
    console.log(`\n[2] SELECT WHERE id = '${targetBId}' (Known Lodge B row)...`);
    const resSelectB = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/${table}?id=eq.${targetBId}&select=*`,
      {
        method: "GET",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${tokenA}`,
          Accept: "application/json",
        },
      }
    );

    const statusB = resSelectB.status;
    const bodyB: any[] = JSON.parse(resSelectB.body);

    console.log(`    Status: ${statusB}`);
    console.log(`    Rows returned: ${bodyB.length}`);
    if (bodyB.length === 0) {
      console.log(`    ✅ PASS: Lodge B row is completely invisible to Lodge A.`);
    } else {
      console.error(`    ❌ FAIL! Lodge A was able to read Lodge B's row!`);
      console.error(JSON.stringify(bodyB, null, 2));
      allPassed = false;
    }

    // 3. UPDATE targetBId attempt
    console.log(`\n[3] UPDATE attempt on Lodge B row '${targetBId}'...`);
    let updatePayload: any = {};
    if (table === "rooms") updatePayload = { room_number: "HACKED" };
    else if (table === "customers") updatePayload = { name: "HACKED" };
    else if (table === "reservations") updatePayload = { special_request: "HACKED" };
    else if (table === "bills") updatePayload = { payment_status: "paid" };
    else if (table === "payments") updatePayload = { method: "HACKED" };

    const resUpdate = await httpsRequest(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${targetBId}`, {
      method: "PATCH",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${tokenA}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updatePayload),
    });

    const statusUpdate = resUpdate.status;
    const bodyUpdate = resUpdate.body;
    console.log(`    Status: ${statusUpdate}`);
    console.log(`    Response Body: ${bodyUpdate}`);

    if (bodyUpdate === "[]" || bodyUpdate === "") {
      console.log(`    ✅ PASS: 0 rows affected. Lodge A cannot mutate Lodge B row.`);
    } else {
      console.error(`    ❌ FAIL! Mutation succeeded or returned unexpected result: ${bodyUpdate}`);
      allPassed = false;
    }
    console.log();
  }

  console.log("================================================================================");
  if (allPassed) {
    console.log("🎉 ALL T-042 TENANT ISOLATION TESTS PASSED WITH 100% RIGOR!");
  } else {
    console.log("💥 T-042 FAILED! Isolation policy violations detected above.");
    process.exit(1);
  }
  console.log("================================================================================");
}

runT042().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

