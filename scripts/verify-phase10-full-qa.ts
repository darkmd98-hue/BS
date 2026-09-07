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
  cookieHeader: string = "",
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string; location?: string }> {
  return new Promise((resolve) => {
    const reqHeaders: Record<string, string> = {
      Host: `${hostname}:3000`,
      ...headers,
    };
    if (cookieHeader) {
      reqHeaders["Cookie"] = cookieHeader;
    }
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path: urlPath,
        method: "GET",
        headers: reqHeaders,
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

async function runQA() {
  console.log("================================================================================");
  console.log("             PHASE 10: COMPREHENSIVE END-TO-END QA & ISOLATION SWEEP             ");
  console.log("================================================================================\n");

  const adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Authenticate both lodges
  console.log("--- 1. Authenticating test lodges ---");
  const cookieA = await signIn("test-lodge-a@example.com", "Password123!");
  const cookieB = await signIn("test-lodge-b@example.com", "Password123!");
  console.log("✅ Authenticated Lodge A (Pinecrest) & Lodge B (Lakeside)\n");

  // Fetch test records
  const { data: lodges } = await adminClient
    .from("lodges")
    .select("id, name, subdomain")
    .in("subdomain", ["pinecrest", "lakeside"]);

  const lodgeA = (lodges as any[]).find((l: any) => l.subdomain === "pinecrest");
  const lodgeB = (lodges as any[]).find((l: any) => l.subdomain === "lakeside");

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

  const { data: roomA } = await adminClient
    .from("rooms")
    .select("id, room_number")
    .eq("lodge_id", lodgeA.id)
    .limit(1)
    .single();

  const { data: roomB } = await adminClient
    .from("rooms")
    .select("id, room_number")
    .eq("lodge_id", lodgeB.id)
    .limit(1)
    .single();

  let passed = 0;
  let failed = 0;

  function report(name: string, ok: boolean, details: string) {
    if (ok) {
      console.log(`✅ PASS: ${name} [${details}]`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} [${details}]`);
      failed++;
    }
  }

  // --- 2. Full User Journey: Lodge A (Pinecrest) ---
  console.log("\n--- 2. Full User Journey: Pinecrest (pinecrest.localhost) ---");

  // Login screen
  const rLoginA = await testRequest("pinecrest.localhost", "/login");
  report("Pinecrest: /login", rLoginA.status === 200, `HTTP ${rLoginA.status}`);

  // Reception Dashboard
  const rDashA = await testRequest("pinecrest.localhost", "/reception", cookieA);
  const dashAOk = rDashA.status === 200 && rDashA.body.includes(lodgeA.name) && !rDashA.body.includes(lodgeB.name);
  report("Pinecrest: /reception Dashboard", dashAOk, `HTTP ${rDashA.status}, Branding: ${lodgeA.name}`);

  // Rooms Directory
  const rRoomsA = await testRequest("pinecrest.localhost", "/reception/rooms", cookieA);
  const roomsAOk = rRoomsA.status === 200 && rRoomsA.body.includes("Room") && !rRoomsA.body.includes(lodgeB.name);
  report("Pinecrest: /reception/rooms", roomsAOk, `HTTP ${rRoomsA.status}`);

  // Stay Details (Room ID)
  if (roomA) {
    const rStayA = await testRequest("pinecrest.localhost", `/reception/rooms/${(roomA as any).id}`, cookieA);
    report("Pinecrest: /reception/rooms/[id]", rStayA.status === 200, `HTTP ${rStayA.status}, Room ${(roomA as any).room_number}`);
  }

  // Reservations List
  const rResA = await testRequest("pinecrest.localhost", "/reception/reservations", cookieA);
  report("Pinecrest: /reception/reservations", rResA.status === 200, `HTTP ${rResA.status}`);

  // Create Reservation Screen
  const rNewResA = await testRequest("pinecrest.localhost", "/reception/reservations/new", cookieA);
  report("Pinecrest: /reception/reservations/new", rNewResA.status === 200, `HTTP ${rNewResA.status}`);

  // Billing Folios
  const rBillA = await testRequest("pinecrest.localhost", "/reception/billing", cookieA);
  report("Pinecrest: /reception/billing", rBillA.status === 200, `HTTP ${rBillA.status}`);

  // Customers Directory
  const rCustA = await testRequest("pinecrest.localhost", "/reception/customers", cookieA);
  report("Pinecrest: /reception/customers", rCustA.status === 200, `HTTP ${rCustA.status}`);

  // Customer Profile
  if (custA) {
    const rProfA = await testRequest("pinecrest.localhost", `/reception/customers/${(custA as any).id}`, cookieA);
    const profAOk = rProfA.status === 200 && rProfA.body.includes((custA as any).name);
    report("Pinecrest: /reception/customers/[id]", profAOk, `HTTP ${rProfA.status}, Customer: ${(custA as any).name}`);
  }

  // Print Invoice
  if (billA) {
    const rPrintA = await testRequest("pinecrest.localhost", `/reception/billing/${(billA as any).id}/print`, cookieA);
    report("Pinecrest: /reception/billing/[id]/print", rPrintA.status === 200, `HTTP ${rPrintA.status}`);
  }

  // Admin Rooms
  const rAdminRoomsA = await testRequest("pinecrest.localhost", "/admin/rooms", cookieA);
  report("Pinecrest: /admin/rooms", rAdminRoomsA.status === 200, `HTTP ${rAdminRoomsA.status}`);

  // Admin Add Room
  const rAdminAddRoomA = await testRequest("pinecrest.localhost", "/admin/rooms/new", cookieA);
  report("Pinecrest: /admin/rooms/new", rAdminAddRoomA.status === 200, `HTTP ${rAdminAddRoomA.status}`);

  // Admin Staff
  const rAdminStaffA = await testRequest("pinecrest.localhost", "/admin/staff", cookieA);
  report("Pinecrest: /admin/staff", rAdminStaffA.status === 200, `HTTP ${rAdminStaffA.status}`);

  // --- 3. Full User Journey: Lodge B (Lakeside) ---
  console.log("\n--- 3. Full User Journey: Lakeside (lakeside.localhost) ---");

  // Login screen
  const rLoginB = await testRequest("lakeside.localhost", "/login");
  report("Lakeside: /login", rLoginB.status === 200, `HTTP ${rLoginB.status}`);

  // Reception Dashboard
  const rDashB = await testRequest("lakeside.localhost", "/reception", cookieB);
  const dashBOk = rDashB.status === 200 && rDashB.body.includes(lodgeB.name) && !rDashB.body.includes(lodgeA.name);
  report("Lakeside: /reception Dashboard", dashBOk, `HTTP ${rDashB.status}, Branding: ${lodgeB.name}`);

  // Rooms Directory
  const rRoomsB = await testRequest("lakeside.localhost", "/reception/rooms", cookieB);
  const roomsBOk = rRoomsB.status === 200 && rRoomsB.body.includes("Room") && !rRoomsB.body.includes(lodgeA.name);
  report("Lakeside: /reception/rooms", roomsBOk, `HTTP ${rRoomsB.status}`);

  // Stay Details (Room ID)
  if (roomB) {
    const rStayB = await testRequest("lakeside.localhost", `/reception/rooms/${(roomB as any).id}`, cookieB);
    report("Lakeside: /reception/rooms/[id]", rStayB.status === 200, `HTTP ${rStayB.status}, Room ${(roomB as any).room_number}`);
  }

  // Reservations List
  const rResB = await testRequest("lakeside.localhost", "/reception/reservations", cookieB);
  report("Lakeside: /reception/reservations", rResB.status === 200, `HTTP ${rResB.status}`);

  // Create Reservation Screen
  const rNewResB = await testRequest("lakeside.localhost", "/reception/reservations/new", cookieB);
  report("Lakeside: /reception/reservations/new", rNewResB.status === 200, `HTTP ${rNewResB.status}`);

  // Billing Folios
  const rBillB = await testRequest("lakeside.localhost", "/reception/billing", cookieB);
  report("Lakeside: /reception/billing", rBillB.status === 200, `HTTP ${rBillB.status}`);

  // Customers Directory
  const rCustB = await testRequest("lakeside.localhost", "/reception/customers", cookieB);
  report("Lakeside: /reception/customers", rCustB.status === 200, `HTTP ${rCustB.status}`);

  // Customer Profile
  if (custB) {
    const rProfB = await testRequest("lakeside.localhost", `/reception/customers/${(custB as any).id}`, cookieB);
    const profBOk = rProfB.status === 200 && rProfB.body.includes((custB as any).name);
    report("Lakeside: /reception/customers/[id]", profBOk, `HTTP ${rProfB.status}, Customer: ${(custB as any).name}`);
  }

  // Print Invoice
  if (billB) {
    const rPrintB = await testRequest("lakeside.localhost", `/reception/billing/${(billB as any).id}/print`, cookieB);
    report("Lakeside: /reception/billing/[id]/print", rPrintB.status === 200, `HTTP ${rPrintB.status}`);
  }

  // Admin Rooms
  const rAdminRoomsB = await testRequest("lakeside.localhost", "/admin/rooms", cookieB);
  report("Lakeside: /admin/rooms", rAdminRoomsB.status === 200, `HTTP ${rAdminRoomsB.status}`);

  // Admin Add Room
  const rAdminAddRoomB = await testRequest("lakeside.localhost", "/admin/rooms/new", cookieB);
  report("Lakeside: /admin/rooms/new", rAdminAddRoomB.status === 200, `HTTP ${rAdminAddRoomB.status}`);

  // Admin Staff
  const rAdminStaffB = await testRequest("lakeside.localhost", "/admin/staff", cookieB);
  report("Lakeside: /admin/staff", rAdminStaffB.status === 200, `HTTP ${rAdminStaffB.status}`);

  // --- 4. Cross-Tenant Data Isolation & Subdomain Guards ---
  console.log("\n--- 4. Cross-Tenant Data Isolation & Subdomain Guards ---");

  // Pinecrest session hitting lakeside.localhost -> must be 403 Forbidden
  const rCrossA = await testRequest("lakeside.localhost", "/reception", cookieA);
  report("Cross-tenant guard: Lodge A session -> lakeside.localhost/reception", rCrossA.status === 403, `HTTP ${rCrossA.status} (expected 403)`);

  const rCrossAdminA = await testRequest("lakeside.localhost", "/admin/rooms", cookieA);
  report("Cross-tenant guard: Lodge A session -> lakeside.localhost/admin/rooms", rCrossAdminA.status === 403, `HTTP ${rCrossAdminA.status} (expected 403)`);

  // Lakeside session hitting pinecrest.localhost -> must be 403 Forbidden
  const rCrossB = await testRequest("pinecrest.localhost", "/reception", cookieB);
  report("Cross-tenant guard: Lodge B session -> pinecrest.localhost/reception", rCrossB.status === 403, `HTTP ${rCrossB.status} (expected 403)`);

  const rCrossAdminB = await testRequest("pinecrest.localhost", "/admin/staff", cookieB);
  report("Cross-tenant guard: Lodge B session -> pinecrest.localhost/admin/staff", rCrossAdminB.status === 403, `HTTP ${rCrossAdminB.status} (expected 403)`);

  // Direct UUID cross-access: Lodge A trying to view Lodge B's customer
  if (custB) {
    const rCrossCust = await testRequest("pinecrest.localhost", `/reception/customers/${(custB as any).id}`, cookieA);
    report("UUID Boundary: Lodge A -> Lodge B Customer ID", rCrossCust.status === 404, `HTTP ${rCrossCust.status} (expected 404)`);
  }

  // Direct UUID cross-access: Lodge A trying to print Lodge B's bill
  if (billB) {
    const rCrossBill = await testRequest("pinecrest.localhost", `/reception/billing/${(billB as any).id}/print`, cookieA);
    report("UUID Boundary: Lodge A -> Lodge B Bill ID", rCrossBill.status === 404, `HTTP ${rCrossBill.status} (expected 404)`);
  }

  // Direct UUID cross-access: Lodge B trying to view Lodge A's room
  if (roomA) {
    const rCrossRoom = await testRequest("lakeside.localhost", `/reception/rooms/${(roomA as any).id}`, cookieB);
    report("UUID Boundary: Lodge B -> Lodge A Room ID", rCrossRoom.status === 404, `HTTP ${rCrossRoom.status} (expected 404)`);
  }

  // --- 5. Error Handling & Edge Cases ---
  console.log("\n--- 5. Error Handling & Edge Cases ---");

  // Bad UUID format in URL (should return clean 404, not 500)
  const rBadUuid = await testRequest("pinecrest.localhost", "/reception/customers/not-a-valid-uuid", cookieA);
  report("Invalid UUID path parameter (/reception/customers/not-a-valid-uuid)", rBadUuid.status === 404, `HTTP ${rBadUuid.status} (expected 404)`);

  const rBadRoomUuid = await testRequest("pinecrest.localhost", "/reception/rooms/invalid-room-id", cookieA);
  report("Invalid UUID path parameter (/reception/rooms/invalid-room-id)", rBadRoomUuid.status === 404, `HTTP ${rBadRoomUuid.status} (expected 404)`);

  // Non-existent UUID
  const rNonExistent = await testRequest("pinecrest.localhost", "/reception/customers/00000000-0000-0000-0000-000000000000", cookieA);
  report("Non-existent UUID parameter", rNonExistent.status === 404, `HTTP ${rNonExistent.status} (expected 404)`);

  // Unknown subdomain
  const rUnknownSubdomain = await testRequest("nonexistent-lodge-999.localhost", "/reception");
  report("Unknown subdomain returns 404", rUnknownSubdomain.status === 404, `HTTP ${rUnknownSubdomain.status} (expected 404)`);

  // Unauthenticated access to protected route
  const rUnauth = await testRequest("pinecrest.localhost", "/reception");
  const unauthOk = rUnauth.status === 307 || rUnauth.status === 302 || (rUnauth.status === 200 && rUnauth.body.includes("Sign In"));
  report("Unauthenticated access redirects to login", unauthOk, `HTTP ${rUnauth.status} (location: ${rUnauth.location || "none"})`);

  console.log("\n================================================================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runQA().catch((e) => {
  console.error("FATAL QA EXCEPTION:", e);
  process.exit(1);
});

