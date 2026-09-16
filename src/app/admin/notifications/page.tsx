import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { getNotificationsData } from "@/lib/notifications";
import { NotificationsManagerClient } from "@/components/notifications/NotificationsManagerClient";

export default async function AdminNotificationsPage() {
  const tenant = await getTenantContext();

  // Strict RBAC: only lodge administrators can configure communications and templates
  if (tenant.role !== "admin") {
    redirect("/reception");
  }

  const data = await getNotificationsData(tenant.lodgeId, tenant.lodgeName);

  return (
    <NotificationsManagerClient
      initialData={data}
      lodgeName={tenant.lodgeName}
      subdomain={tenant.lodgeSubdomain || "pinecrest"}
    />
  );
}
