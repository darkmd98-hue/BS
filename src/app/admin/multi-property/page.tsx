import { getTenantContext } from "@/lib/tenant";
import { getMultiPropertyData } from "@/lib/multi-property";
import { MultiPropertyClient } from "@/components/organization/MultiPropertyClient";

export default async function MultiPropertyPage() {
  const tenant = await getTenantContext();
  const data = await getMultiPropertyData(tenant.lodgeId, tenant.userId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <MultiPropertyClient data={data} />
    </div>
  );
}

