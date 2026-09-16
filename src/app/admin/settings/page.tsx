import { getTenantContext } from "@/lib/tenant";
import { getLodgeSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const tenant = await getTenantContext();
  const settings = await getLodgeSettings(tenant.lodgeId);

  // Get staff count for Roles tab
  const supabase = await createClient();
  const { count } = await (supabase as any)
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("lodge_id", tenant.lodgeId);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-xs text-gray-400">Manage your property configuration</p>
        </div>
      </div>

      <SettingsClient settings={settings} staffCount={count ?? 0} role={tenant.role} />
    </div>
  );
}

