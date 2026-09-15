import { Suspense } from "react";
import { getTenantContext } from "@/lib/tenant";
import {
  getMaintenanceTickets,
  getMaintenanceRooms,
  getMaintenanceStaff,
} from "@/lib/maintenance";
import { MaintenanceClient } from "@/components/maintenance/MaintenanceClient";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const tenant = await getTenantContext();

  const [tickets, rooms, staff] = await Promise.all([
    getMaintenanceTickets(tenant.lodgeId),
    getMaintenanceRooms(tenant.lodgeId),
    getMaintenanceStaff(tenant.lodgeId),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-sans">Maintenance & Repairs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track property maintenance tickets, room repairs, and technician assignments for {tenant.lodgeName}.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading maintenance workspace…
          </div>
        }
      >
        <MaintenanceClient tickets={tickets} rooms={rooms} staff={staff} />
      </Suspense>
    </div>
  );
}
