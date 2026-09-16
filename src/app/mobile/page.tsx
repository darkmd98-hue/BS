import { getTenantContext } from "@/lib/tenant";
import { getMobileStaffData } from "@/lib/mobile";
import { MobileStaffClient } from "@/components/mobile/MobileStaffClient";

export default async function MobileStaffPage() {
  const tenant = await getTenantContext();
  const data = await getMobileStaffData(
    tenant.lodgeId,
    tenant.lodgeName,
    tenant.lodgeSubdomain,
    {
      id: tenant.userId,
      name: tenant.profile.full_name,
      email: tenant.userEmail,
      role: tenant.role,
    }
  );

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-3 flex flex-col justify-center">
      <MobileStaffClient data={data} />
    </div>
  );
}

