import { Suspense } from "react";
import { getTenantContext } from "@/lib/tenant";
import { getRoomsNeedingCleaning, getCleaningLog } from "@/lib/housekeeping";
import { HousekeepingClient } from "@/components/housekeeping/HousekeepingClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HousekeepingPage() {
  const tenant = await getTenantContext();

  const [rooms, log] = await Promise.all([
    getRoomsNeedingCleaning(tenant.lodgeId),
    getCleaningLog(tenant.lodgeId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Housekeeping</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage room cleaning queue and track cleaning history for {tenant.lodgeName}.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading housekeeping data…
          </div>
        }
      >
        <HousekeepingClient rooms={rooms} log={log} />
      </Suspense>
    </div>
  );
}
