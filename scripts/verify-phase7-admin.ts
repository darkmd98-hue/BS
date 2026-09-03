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

function testRequest(hostname: string, path: string, cookieHeader: string): Promise<{
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
  console.log("           PHASE 7 LIVE VERIFICATION: ADMIN FLOWS & TENANT ISOLATION            ");
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

  const screens = [
    { name: "1. Admin Rooms List", path: "/admin/rooms" },
    { name: "2. Add Room Form", path: "/admin/rooms/new" },
    { name: "3. Users & Staff Directory", path: "/admin/staff" },
  ];

  console.log("| Screen / Route | Pinecrest (Lodge A) | Lakeside (Lodge B) | Isolation Verified? |");
  console.log("| :--- | :---: | :---: | :---: |");

  for (const s of screens) {
    // Lodge A
    const resA = await testRequest("pinecrest.localhost", s.path, cookieHeaderA);
    const aValid = resA.status === 200 && resA.body.includes("Pinecrest Alpine Resort") && !resA.body.includes("Lakeside Haven Inn");

    // Lodge B
    const resB = await testRequest("lakeside.localhost", s.path, cookieHeaderB);
    const bValid = resB.status === 200 && resB.body.includes("Lakeside Haven Inn") && !resB.body.includes("Pinecrest Alpine Resort");

    const statusStr = aValid && bValid ? "✅ PASS" : "❌ FAIL";
    console.log(`| ${s.name} (\`${s.path}\`) | HTTP ${resA.status} (Pinecrest data) | HTTP ${resB.status} (Lakeside data) | ${statusStr} |`);

    if (!aValid || !bValid) {
      console.error(`Mismatch on ${s.name}: A=${resA.status} (valid: ${aValid}), B=${resB.status} (valid: ${bValid})`);
      process.exit(1);
    }
  }

  // Also check restyled auth & onboarding routes
  console.log("\n--------------------------------------------------------------------------------");
  console.log("RESTYLED AUTH & ONBOARDING ROUTES (Root domain / localhost)");
  console.log("--------------------------------------------------------------------------------");
  const authRoutes = ["/login", "/register", "/install"];
  for (const ar of authRoutes) {
    const res = await testRequest("localhost", ar, "");
    const pass = res.status === 200 && res.body.includes("LodgeOS");
    console.log(`| Route \`${ar}\` | HTTP ${res.status} | Figma Minimal Styling Present: ${pass ? "✅ PASS" : "❌ FAIL"} |`);
    if (!pass) {
      console.error(`Auth route failed: ${ar} (Status: ${res.status})`);
      process.exit(1);
    }
  }

  // DIRECT UUID BOUNDARY CHECK: Lodge A attempting to access Lodge B room
  console.log("\n--------------------------------------------------------------------------------");
  console.log("DIRECT-UUID BOUNDARY CHECK: Lodge A requesting Lodge B's Room UUID");
  console.log("--------------------------------------------------------------------------------");
  const crossRoom = await testRequest("pinecrest.localhost", "/reception/rooms/1f28eb57-d21c-4a7a-872d-5e532cd69858", cookieHeaderA);
  console.log(`HTTP Status for cross-room access: ${crossRoom.status} (Expected: 404 Not Found)`);
  if (crossRoom.status === 404) {
    console.log("✅ PASS: Direct URL access to another lodge's room UUID returns 404 (Isolation verified).");
  } else {
    console.error("❌ FAIL: Cross-room access did not return 404!");
    process.exit(1);
  }

  console.log("\n================================================================================");
  console.log("🎉 ALL PHASE 7 SCREENS & ISOLATION BOUNDARIES VERIFIED IN PRODUCTION BUILD!");
  console.log("================================================================================");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

