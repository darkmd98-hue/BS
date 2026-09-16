import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { getPaymentGatewaysData } from "@/lib/payments-gateway";
import { PaymentGatewayClient } from "@/components/payments/PaymentGatewayClient";

export default async function AdminPaymentsPage() {
  const tenant = await getTenantContext();

  // Strict RBAC: only lodge administrators can manage financial payment gateways
  if (tenant.role !== "admin") {
    redirect("/reception");
  }

  const data = await getPaymentGatewaysData(tenant.lodgeId, tenant.lodgeName);

  return (
    <PaymentGatewayClient
      initialData={data}
      lodgeName={tenant.lodgeName}
      subdomain={tenant.lodgeSubdomain || "pinecrest"}
    />
  );
}
