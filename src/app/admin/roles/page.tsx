import { getTenantContext } from "@/lib/tenant";
import { getRBACData } from "@/lib/rbac";
import { AdvancedRBACClient } from "@/components/rbac/AdvancedRBACClient";

export default async function RolesAndSecurityPage() {
  const tenant = await getTenantContext();
  const data = await getRBACData(tenant.lodgeId, tenant.lodgeName);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdvancedRBACClient data={data} />
    </div>
  );
}
