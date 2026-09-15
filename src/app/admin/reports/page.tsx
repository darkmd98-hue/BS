import { Suspense } from "react";
import { getTenantContext } from "@/lib/tenant";
import { getLodgeReportsData } from "@/lib/reports";
import { ReportsClient } from "@/components/reports/ReportsClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const tenant = await getTenantContext();
  const reportsData = await getLodgeReportsData(tenant.lodgeId, tenant.lodgeName);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Reports & Financial Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Executive performance overview, occupancy metrics, and payment distribution for {tenant.lodgeName}.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Generating reports & computing metrics…
          </div>
        }
      >
        <ReportsClient data={reportsData} />
      </Suspense>
    </div>
  );
}

