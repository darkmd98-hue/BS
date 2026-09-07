import { getTenantContext } from "@/lib/tenant";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenantContext();
  if (tenant.role !== 'admin') {
    redirect('/reception');
  }

  return (
    <div className="flex h-screen bg-[#f4f6fc] overflow-hidden font-sans">
      <Sidebar
        lodgeName={tenant.lodgeName}
        subdomain={tenant.lodgeSubdomain}
        userName={tenant.profile.full_name || tenant.userEmail || "Administrator"}
        userRole={tenant.role}
        portalType="admin"
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          lodgeName={tenant.lodgeName}
          userName={tenant.profile.full_name || tenant.userEmail || "Administrator"}
          userRole={tenant.role}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
