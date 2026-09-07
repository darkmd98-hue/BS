import { getTenantContext } from "@/lib/tenant";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";

export default async function ReceptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantContext();

  return (
    <div className="flex h-screen bg-[#f4f6fc] overflow-hidden font-sans print:block print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar
          lodgeName={tenant.lodgeName}
          subdomain={tenant.lodgeSubdomain}
          userName={tenant.profile.full_name || tenant.userEmail || "Staff Member"}
          userRole={tenant.role}
          portalType="reception"
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:block print:overflow-visible">
        <div className="print:hidden">
          <Header
            lodgeName={tenant.lodgeName}
            userName={tenant.profile.full_name || tenant.userEmail || "Staff Member"}
            userRole={tenant.role}
          />
        </div>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
