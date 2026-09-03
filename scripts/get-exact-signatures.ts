import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Let's inspect the exact oid and signature via RPC or query if possible
  const { data, error } = await supabase.rpc("create_new_lodge_tenant", {
    p_user_id: "00000000-0000-0000-0000-000000000000",
    p_owner_name: "test",
    p_lodge_name: "test",
    p_address: "test"
  });
  console.log("Error details:", error);
}

main().catch(console.error);

