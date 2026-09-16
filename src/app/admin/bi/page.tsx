import { getTenantContext } from "@/lib/tenant";
import { getBIFinancialData } from "@/lib/bi";
import { AdvancedBIClient } from "@/components/bi/AdvancedBIClient";

export default async function AdvancedBIPage() {
  const tenant = await getTenantContext();
  const data = await getBIFinancialData(tenant.lodgeId, tenant.lodgeName);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <AdvancedBIClient data={data} />
    </div>
  );
}

